/**
 * Reference market-data proxy for Geldstart (Twelve Data).
 *
 * The browser app never sees the vendor API key. It calls this proxy, which
 * adds the key server-side, validates all input, caches responses, limits the
 * number of upstream calls and translates the vendor format into the app's
 * internal contract (see src/lib/market-data/http-provider.ts).
 *
 * Runtime: any platform with the standard Fetch API (Cloudflare Workers,
 * Deno, Bun, Node ≥ 18). Entry points: ./worker.ts and ./dev.ts.
 *
 * LICENSING: check the vendor terms before going live. Displaying market
 * data to app users ("external display") requires a suitable commercial plan.
 */

export interface ProxyEnv {
  /** Twelve Data API key. Secret – set it as a platform secret, never in code. */
  TWELVE_DATA_API_KEY?: string;
  /** Comma-separated list of allowed browser origins, e.g. "https://user.github.io". */
  ALLOWED_ORIGINS?: string;
  /**
   * Status reported for quotes while the market is open. Defaults to
   * "delayed". Only set "realtime" if your plan provides real-time data for
   * every exchange you serve.
   */
  OPEN_MARKET_STATUS?: string;
  /** Upper bound of upstream calls per minute (default 8, Twelve Data Basic plan). */
  UPSTREAM_CALLS_PER_MINUTE?: string;
}

export interface ProxyOptions {
  env: ProxyEnv;
  fetchImpl?: typeof fetch;
  clock?: () => Date;
}

type AssetType = "etf" | "bond-etf" | "stock";
type Json = Record<string, unknown>;

const UPSTREAM = "https://api.twelvedata.com";
const ID_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,14}:[A-Z0-9]{2,6}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const RANGE_OUTPUT: Record<string, number> = { "1M": 23, "6M": 130, "1J": 255 };
const TTL_MS = {
  search: 60 * 60_000,
  quote: 60_000,
  history: 6 * 60 * 60_000,
  instrument: 24 * 60 * 60_000,
  fx: 5 * 60_000,
} as const;
const MAX_CACHE_ENTRIES = 500;
const BOND_WORDS =
  /\b(bond|bonds|anleihe|anleihen|treasury|govt|government|aggregate|renten|corporate)\b/i;

type ProxyErrorKind = "rate-limit" | "provider-error" | "unsupported" | "not-found" | "bad-request";

class ProxyError extends Error {
  readonly status: number;
  readonly kind: ProxyErrorKind;
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, kind: ProxyErrorKind, message: string, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** Twelve Data sends numbers as strings. */
function num(value: unknown): number | undefined {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapAssetType(instrumentType: unknown, name: unknown): AssetType | null {
  const type = typeof instrumentType === "string" ? instrumentType.toLowerCase() : "";
  if (type === "common stock") return "stock";
  if (type === "etf")
    return BOND_WORDS.test(typeof name === "string" ? name : "") ? "bond-etf" : "etf";
  return null;
}

function splitId(id: string): { symbol: string; mic: string } {
  const [symbol = "", mic = ""] = id.split(":");
  return { symbol, mic };
}

function requireId(url: URL): string {
  const id = url.searchParams.get("id")?.trim().toUpperCase() ?? "";
  if (!ID_PATTERN.test(id))
    throw new ProxyError(400, "bad-request", "Ungültige Wertpapier-Kennung.");
  return id;
}

function mapInstrument(entry: Json) {
  const symbol = str(entry["symbol"]);
  const mic = str(entry["mic_code"]);
  const name = str(entry["instrument_name"]);
  const currency = str(entry["currency"]);
  const type = mapAssetType(entry["instrument_type"], entry["instrument_name"]);
  if (!symbol || !mic || !name || !currency || !type) return null;
  const id = `${symbol}:${mic}`.toUpperCase();
  if (!ID_PATTERN.test(id)) return null;
  const instrument: Json = {
    id,
    symbol,
    name,
    type,
    currency,
    exchange: str(entry["exchange"]) ?? mic,
  };
  const country = str(entry["country"]);
  if (country) instrument["country"] = country;
  return instrument;
}

interface CacheEntry {
  expires: number;
  body: Json;
}

export function createProxy({ env, fetchImpl, clock = () => new Date() }: ProxyOptions) {
  const doFetch = fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<Json>>();
  const callTimes: number[] = [];
  const perMinute = Math.max(1, Math.floor(num(env.UPSTREAM_CALLS_PER_MINUTE) ?? 8));
  const openStatus = env.OPEN_MARKET_STATUS === "realtime" ? "realtime" : "delayed";
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  let blockedUntil = 0;

  function corsHeaders(origin: string | null): Record<string, string> {
    if (!origin || !allowedOrigins.includes(origin)) return { Vary: "Origin" };
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
  }

  function json(
    body: unknown,
    status: number,
    origin: string | null,
    extra: Record<string, string> = {},
  ) {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": status === 200 ? "public, max-age=30" : "no-store",
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders(origin),
        ...extra,
      },
    });
  }

  /** Calls Twelve Data with the key in a header, never in the URL. */
  async function upstream(path: string, params: Record<string, string>): Promise<Json> {
    const key = env.TWELVE_DATA_API_KEY?.trim();
    if (!key)
      throw new ProxyError(503, "provider-error", "Der Kursdaten-Dienst ist nicht eingerichtet.");
    const now = clock().getTime();
    if (now < blockedUntil) {
      throw new ProxyError(
        429,
        "rate-limit",
        "Abfragelimit erreicht.",
        Math.ceil((blockedUntil - now) / 1000),
      );
    }
    while (callTimes.length > 0 && (callTimes[0] ?? 0) <= now - 60_000) callTimes.shift();
    if (callTimes.length >= perMinute) {
      const retry = Math.max(1, Math.ceil(((callTimes[0] ?? now) + 60_000 - now) / 1000));
      throw new ProxyError(429, "rate-limit", "Abfragelimit erreicht.", retry);
    }
    callTimes.push(now);

    let response: Response;
    try {
      response = await doFetch(`${UPSTREAM}/${path}?${new URLSearchParams(params).toString()}`, {
        headers: { Authorization: `apikey ${key}`, Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new ProxyError(502, "provider-error", "Der Kursdaten-Anbieter ist nicht erreichbar.");
    }
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // handled below
    }
    // Twelve Data reports errors either via HTTP status or via { status: "error", code }.
    const code = isRecord(body) && body["status"] === "error" ? num(body["code"]) : undefined;
    const status = code ?? (response.ok ? 200 : response.status);
    if (status === 429) {
      blockedUntil = clock().getTime() + 60_000;
      throw new ProxyError(429, "rate-limit", "Abfragelimit des Anbieters erreicht.", 60);
    }
    if (status === 404 || status === 400) throw new ProxyError(404, "not-found", "Nicht gefunden.");
    if (status === 401 || status === 403) {
      // Usually: plan does not cover this exchange. Upstream messages are not forwarded.
      throw new ProxyError(
        422,
        "unsupported",
        "Dieses Wertpapier ist mit dem aktuellen Datentarif nicht verfügbar.",
      );
    }
    if (status !== 200 || !isRecord(body)) {
      throw new ProxyError(
        502,
        "provider-error",
        "Der Kursdaten-Anbieter hat einen Fehler gemeldet.",
      );
    }
    return body;
  }

  async function cached(key: string, ttl: number, load: () => Promise<Json>): Promise<Json> {
    const now = clock().getTime();
    const hit = cache.get(key);
    if (hit && hit.expires > now) return hit.body;
    const running = inFlight.get(key);
    if (running) return running;
    const promise = load()
      .then((body) => {
        if (cache.size >= MAX_CACHE_ENTRIES) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
        cache.set(key, { expires: clock().getTime() + ttl, body });
        return body;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  async function search(url: URL): Promise<Json> {
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 40);
    if (q.length < 2) return { results: [] };
    return cached(`search:${q.toLowerCase()}`, TTL_MS.search, async () => {
      const body = await upstream("symbol_search", { symbol: q, outputsize: "30" });
      const data = Array.isArray(body["data"]) ? body["data"] : [];
      const results = data
        .filter(isRecord)
        .map(mapInstrument)
        .filter((x) => x !== null);
      return { results: results.slice(0, 20) };
    });
  }

  async function instrument(url: URL): Promise<Json> {
    const id = requireId(url);
    const { symbol } = splitId(id);
    return cached(`instrument:${id}`, TTL_MS.instrument, async () => {
      const body = await upstream("symbol_search", { symbol, outputsize: "30" });
      const data = Array.isArray(body["data"]) ? body["data"] : [];
      const match = data
        .filter(isRecord)
        .map(mapInstrument)
        .find((entry) => entry?.["id"] === id);
      if (!match) throw new ProxyError(404, "not-found", "Wertpapier nicht gefunden.");
      return { instrument: match };
    });
  }

  async function quote(url: URL): Promise<Json> {
    const id = requireId(url);
    const { symbol, mic } = splitId(id);
    return cached(`quote:${id}`, TTL_MS.quote, async () => {
      const body = await upstream("quote", { symbol, mic_code: mic });
      const price = num(body["close"]);
      const currency = str(body["currency"]);
      if (!price || price <= 0 || !currency) {
        throw new ProxyError(502, "provider-error", "Unvollständige Kursdaten.");
      }
      const lastQuoteAt = num(body["last_quote_at"]) ?? num(body["timestamp"]);
      const date = str(body["datetime"]);
      const marketOpen = body["is_market_open"] === true;
      let asOf: string;
      let asOfPrecision: "minute" | "day";
      if (lastQuoteAt) {
        asOf = new Date(lastQuoteAt * 1000).toISOString();
        asOfPrecision = "minute";
      } else if (date && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        asOf = `${date.slice(0, 10)}T12:00:00.000Z`;
        asOfPrecision = "day";
      } else {
        throw new ProxyError(502, "provider-error", "Kurs ohne Zeitstempel.");
      }
      const result: Json = {
        price,
        currency,
        asOf,
        asOfPrecision,
        status: marketOpen ? openStatus : "eod",
        exchange: str(body["exchange"]) ?? mic,
      };
      const previousClose = num(body["previous_close"]);
      if (previousClose && previousClose > 0) result["previousClose"] = previousClose;
      const change = num(body["change"]);
      if (change !== undefined) result["change"] = change;
      const changePercent = num(body["percent_change"]);
      if (changePercent !== undefined) result["changePercent"] = changePercent;
      return { quote: result };
    });
  }

  async function history(url: URL): Promise<Json> {
    const id = requireId(url);
    const range = url.searchParams.get("range") ?? "";
    const outputsize = RANGE_OUTPUT[range];
    if (!outputsize) throw new ProxyError(400, "bad-request", "Ungültiger Zeitraum.");
    const { symbol, mic } = splitId(id);
    const today = clock().toISOString().slice(0, 10);
    return cached(`history:${id}:${range}`, TTL_MS.history, async () => {
      const body = await upstream("time_series", {
        symbol,
        mic_code: mic,
        interval: "1day",
        outputsize: String(outputsize),
      });
      const meta = isRecord(body["meta"]) ? body["meta"] : {};
      const values = Array.isArray(body["values"]) ? body["values"] : [];
      const points = values
        .filter(isRecord)
        .map((v) => ({ date: str(v["datetime"])?.slice(0, 10), close: num(v["close"]) }))
        .filter((p): p is { date: string; close: number } => !!p.date && !!p.close && p.close > 0)
        // Today's daily bar may still be moving; only completed days are "Schlusskurse".
        .filter((p) => p.date < today)
        .sort((a, b) => a.date.localeCompare(b.date));
      const currency = str(meta["currency"]);
      if (!currency) throw new ProxyError(502, "provider-error", "Unvollständige Verlaufsdaten.");
      return { history: { currency, status: "eod", points } };
    });
  }

  async function fx(url: URL): Promise<Json> {
    const from = url.searchParams.get("from")?.toUpperCase() ?? "";
    const to = url.searchParams.get("to")?.toUpperCase() ?? "";
    if (!CURRENCY_PATTERN.test(from) || !CURRENCY_PATTERN.test(to)) {
      throw new ProxyError(400, "bad-request", "Ungültige Währung.");
    }
    return cached(`fx:${from}/${to}`, TTL_MS.fx, async () => {
      const body = await upstream("exchange_rate", { symbol: `${from}/${to}` });
      const rate = num(body["rate"]);
      const timestamp = num(body["timestamp"]);
      if (!rate || rate <= 0 || !timestamp)
        throw new ProxyError(502, "provider-error", "Unvollständiger Wechselkurs.");
      return { rate: { rate, asOf: new Date(timestamp * 1000).toISOString() } };
    });
  }

  const routes: Record<string, (url: URL) => Promise<Json>> = {
    "/v1/search": search,
    "/v1/quote": quote,
    "/v1/history": history,
    "/v1/instrument": instrument,
    "/v1/fx": fx,
  };

  return async function handle(request: Request): Promise<Response> {
    const origin = request.headers.get("Origin");
    // Browsers always send Origin for cross-origin requests; unknown sites are refused.
    if (origin && !allowedOrigins.includes(origin)) {
      return json(
        { error: { kind: "provider-error", message: "Origin nicht erlaubt." } },
        403,
        null,
      );
    }
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "GET") {
      return json({ error: { kind: "provider-error", message: "Nur GET." } }, 405, origin, {
        Allow: "GET, OPTIONS",
      });
    }
    const url = new URL(request.url);
    const route = routes[url.pathname.replace(/\/+$/, "")];
    if (!route)
      return json({ error: { kind: "not-found", message: "Unbekannter Pfad." } }, 404, origin);
    try {
      return json(await route(url), 200, origin);
    } catch (error) {
      const failure =
        error instanceof ProxyError
          ? error
          : new ProxyError(500, "provider-error", "Interner Fehler im Kurs-Proxy.");
      const body = {
        error: {
          kind: failure.kind === "bad-request" ? "provider-error" : failure.kind,
          message: failure.message,
          ...(failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : {}),
        },
      };
      return json(
        body,
        failure.status,
        origin,
        failure.retryAfterSeconds ? { "Retry-After": String(failure.retryAfterSeconds) } : {},
      );
    }
  };
}
