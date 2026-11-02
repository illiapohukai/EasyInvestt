import { MarketDataError, type MarketDataErrorKind } from "./errors";
import type {
  AssetType,
  ExchangeRate,
  HistoryRange,
  Instrument,
  InstrumentDetails,
  MarketDataProvider,
  PricePoint,
  ProviderInfo,
  Quote,
  QuoteStatus,
} from "./types";

/**
 * Market-data adapter for the internal HTTP contract (version 1).
 *
 * The adapter never talks to a market-data vendor directly. It calls a
 * server-side proxy (reference implementation: server/market-data-proxy)
 * which keeps the vendor API key secret. The proxy URL is public.
 *
 *   GET {base}/v1/search?q=…               -> { results: Instrument[] }
 *   GET {base}/v1/quote?id=…               -> { quote: Quote (without fetchedAt/providerId) }
 *   GET {base}/v1/history?id=…&range=1M    -> { history: { currency, status, points } }
 *   GET {base}/v1/instrument?id=…          -> { instrument: InstrumentDetails }
 *   GET {base}/v1/fx?from=USD&to=EUR       -> { rate: { rate, asOf } }
 *   Errors: non-2xx with { error: { kind, message, retryAfterSeconds? } }
 */

const REQUEST_TIMEOUT_MS = 10_000;
const ASSET_TYPES: readonly AssetType[] = ["etf", "bond-etf", "stock"];
const QUOTE_STATUSES: readonly QuoteStatus[] = ["realtime", "delayed", "eod"];
const ERROR_KINDS: readonly MarketDataErrorKind[] = [
  "rate-limit",
  "provider-error",
  "unsupported",
  "not-found",
  "invalid-response",
];

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function invalid(): MarketDataError {
  return new MarketDataError("invalid-response", "Unvollständige Antwort des Datenanbieters.");
}

export function parseInstrument(value: unknown): InstrumentDetails {
  if (!isRecord(value)) throw invalid();
  const id = text(value["id"]);
  const symbol = text(value["symbol"]);
  const name = text(value["name"]);
  const currency = text(value["currency"]);
  const type = value["type"];
  if (!id || !symbol || !name || !currency || !ASSET_TYPES.includes(type as AssetType)) {
    throw invalid();
  }
  const instrument: InstrumentDetails = { id, symbol, name, currency, type: type as AssetType };
  const optional = ["exchange", "country", "sector", "region", "description"] as const;
  for (const key of optional) {
    const entry = text(value[key]);
    if (entry) instrument[key] = entry;
  }
  const holdings = positiveNumber(value["holdingsCount"]);
  if (holdings) instrument.holdingsCount = holdings;
  return instrument;
}

export function parseQuote(
  value: unknown,
  instrumentId: string,
  providerId: string,
  now: Date,
): Quote {
  if (!isRecord(value)) throw invalid();
  const price = positiveNumber(value["price"]);
  const currency = text(value["currency"]);
  const asOf = value["asOf"];
  const status = value["status"];
  const precision = value["asOfPrecision"] === "day" ? "day" : "minute";
  if (
    !price ||
    !currency ||
    !isIsoTimestamp(asOf) ||
    !QUOTE_STATUSES.includes(status as QuoteStatus)
  ) {
    throw invalid();
  }
  const quote: Quote = {
    instrumentId,
    price,
    currency,
    asOf,
    asOfPrecision: precision,
    fetchedAt: now.toISOString(),
    status: status as QuoteStatus,
    providerId,
  };
  const previousClose = positiveNumber(value["previousClose"]);
  if (previousClose) quote.previousClose = previousClose;
  const change = finiteNumber(value["change"]);
  if (change !== undefined) quote.change = change;
  const changePercent = finiteNumber(value["changePercent"]);
  if (changePercent !== undefined) quote.changePercent = changePercent;
  const exchange = text(value["exchange"]);
  if (exchange) quote.exchange = exchange;
  return quote;
}

function parsePoints(value: unknown): PricePoint[] {
  if (!Array.isArray(value)) throw invalid();
  const points: PricePoint[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const date = text(entry["date"]);
    const close = positiveNumber(entry["close"]);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && close) points.push({ date, close });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

async function errorFromResponse(response: Response): Promise<MarketDataError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Body is optional for errors.
  }
  const error = isRecord(body) && isRecord(body["error"]) ? body["error"] : {};
  const retryHeader = Number(response.headers.get("Retry-After"));
  const retryBody = finiteNumber(error["retryAfterSeconds"]);
  const retryAfter =
    retryBody ?? (Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined);
  const message = text(error["message"]) ?? "";
  const kind = error["kind"];

  if (response.status === 429 || kind === "rate-limit") {
    return new MarketDataError("rate-limit", message, retryAfter);
  }
  if (typeof kind === "string" && ERROR_KINDS.includes(kind as MarketDataErrorKind)) {
    return new MarketDataError(kind as MarketDataErrorKind, message);
  }
  if (response.status === 404) return new MarketDataError("not-found", message);
  if (response.status === 422) return new MarketDataError("unsupported", message);
  return new MarketDataError("provider-error", message);
}

function combineSignals(signal: AbortSignal | undefined): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || typeof AbortSignal.timeout !== "function")
    return signal;
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  if (!signal) return timeout;
  return typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeout]) : signal;
}

export interface HttpProviderOptions {
  baseUrl: string;
  info: ProviderInfo;
  fetchImpl?: typeof fetch;
  clock?: () => Date;
}

export function createHttpProvider({
  baseUrl,
  info,
  fetchImpl,
  clock = () => new Date(),
}: HttpProviderOptions): MarketDataProvider {
  const root = baseUrl.replace(/\/+$/, "");
  const doFetch = fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function request(
    path: string,
    params: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<Json> {
    const url = `${root}/v1/${path}?${new URLSearchParams(params).toString()}`;
    let response: Response;
    try {
      const combined = combineSignals(signal);
      response = await doFetch(url, {
        headers: { Accept: "application/json" },
        ...(combined ? { signal: combined } : {}),
      });
    } catch (error) {
      if (signal?.aborted) throw new MarketDataError("aborted", "Anfrage abgebrochen.");
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new MarketDataError("offline", "Keine Internetverbindung.");
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new MarketDataError("provider-error", "Der Datenanbieter antwortet nicht.");
      }
      throw new MarketDataError("provider-error", "Der Datenanbieter ist nicht erreichbar.");
    }
    if (!response.ok) throw await errorFromResponse(response);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw invalid();
    }
    if (!isRecord(body)) throw invalid();
    return body;
  }

  return {
    info,
    mode: "market",

    async searchInstruments(query, signal): Promise<Instrument[]> {
      const body = await request("search", { q: query }, signal);
      const results = body["results"];
      if (!Array.isArray(results)) throw invalid();
      const instruments: Instrument[] = [];
      for (const entry of results) {
        try {
          instruments.push(parseInstrument(entry));
        } catch {
          // Skip malformed entries instead of failing the whole search.
        }
      }
      return instruments;
    },

    async getQuote(instrumentId, signal) {
      const body = await request("quote", { id: instrumentId }, signal);
      return parseQuote(body["quote"], instrumentId, info.id, clock());
    },

    async getHistoricalPrices(instrumentId, range: HistoryRange, signal) {
      const body = await request("history", { id: instrumentId, range }, signal);
      const history = body["history"];
      if (!isRecord(history)) throw invalid();
      const currency = text(history["currency"]);
      const status = history["status"];
      if (!currency || !QUOTE_STATUSES.includes(status as QuoteStatus)) throw invalid();
      return {
        instrumentId,
        currency,
        range,
        status: status as QuoteStatus,
        points: parsePoints(history["points"]),
        providerId: info.id,
      };
    },

    async getInstrumentDetails(instrumentId, signal) {
      const body = await request("instrument", { id: instrumentId }, signal);
      return parseInstrument(body["instrument"]);
    },

    async getExchangeRate(from, to, signal): Promise<ExchangeRate> {
      const body = await request("fx", { from, to }, signal);
      const rate = body["rate"];
      if (!isRecord(rate)) throw invalid();
      const value = positiveNumber(rate["rate"]);
      const asOf = rate["asOf"];
      if (!value || !isIsoTimestamp(asOf)) throw invalid();
      return { from, to, rate: value, asOf, providerId: info.id };
    },
  };
}
