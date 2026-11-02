import { resolveProxyUrl } from "@/config/market-data";
import { createDemoProvider } from "./demo-provider";
import { DEMO_INSTRUMENTS } from "./demo/instruments";
import { MarketDataError } from "./errors";
import { createHttpProvider } from "./http-provider";
import { createMarketDataService } from "./service";
import { getDisplayStatus, isQuoteUsableForOrder, needsRefresh } from "./status";
import type { MarketDataProvider, Quote } from "./types";

const at = (iso: string) => () => new Date(iso);

describe("demo provider", () => {
  it("is deterministic and marks every value as demo", async () => {
    const a = await createDemoProvider(at("2026-11-02T10:00:00")).getQuote("demo-welt");
    const b = await createDemoProvider(at("2026-11-02T18:00:00")).getQuote("demo-welt");
    expect(a.price).toBe(b.price);
    expect(a.status).toBe("demo");
    expect(a.currency).toBe("EUR");
    expect(a.asOfPrecision).toBe("day");
    expect(a.price).toBeGreaterThan(0);
  });

  it("keeps Friday's price on the weekend and changes on weekdays", async () => {
    const friday = await createDemoProvider(at("2026-11-06T12:00:00")).getQuote("demo-solarfeld");
    const sunday = await createDemoProvider(at("2026-11-08T12:00:00")).getQuote("demo-solarfeld");
    const monday = await createDemoProvider(at("2026-11-09T12:00:00")).getQuote("demo-solarfeld");
    expect(sunday.price).toBe(friday.price);
    expect(sunday.asOf.slice(0, 10)).toBe("2026-11-06");
    expect(monday.price).not.toBe(friday.price);
    expect(monday.previousClose).toBe(friday.price);
  });

  it("has only euro instruments with neutral descriptions", () => {
    for (const instrument of DEMO_INSTRUMENTS) {
      expect(instrument.currency).toBe("EUR");
      expect(instrument.fictional).toBe(true);
      expect(instrument.description).toMatch(/^Fiktive/);
      expect(instrument.description).not.toMatch(/kaufen|empfehl|Kursziel|garantiert/i);
    }
  });

  it("searches by name, symbol, sector and type", async () => {
    const provider = createDemoProvider(at("2026-11-02T10:00:00"));
    expect((await provider.searchInstruments("pixel")).map((i) => i.id)).toEqual([
      "demo-pixelwerk",
    ]);
    expect((await provider.searchInstruments("SOLF")).map((i) => i.id)).toEqual(["demo-solarfeld"]);
    expect((await provider.searchInstruments("energie")).length).toBe(2);
    expect((await provider.searchInstruments("anleihen")).map((i) => i.id)).toEqual([
      "demo-anleihen",
    ]);
    expect(await provider.searchInstruments("gibtsnicht")).toEqual([]);
    expect((await provider.searchInstruments("")).length).toBe(DEMO_INSTRUMENTS.length);
  });

  it("returns a demo price history ending today and rejects unknown ids and currencies", async () => {
    const provider = createDemoProvider(at("2026-11-02T10:00:00"));
    const history = await provider.getHistoricalPrices("demo-welt", "1M");
    expect(history.points).toHaveLength(21);
    expect(history.points.at(-1)?.date).toBe("2026-11-02");
    expect(history.status).toBe("demo");
    await expect(provider.getQuote("nope")).rejects.toMatchObject({ kind: "not-found" });
    await expect(provider.getExchangeRate("USD", "EUR")).rejects.toMatchObject({
      kind: "unsupported",
    });
  });
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function http(fetchImpl: typeof fetch) {
  return createHttpProvider({
    baseUrl: "https://proxy.example/",
    info: { id: "market", name: "Test" },
    fetchImpl,
    clock: at("2026-11-02T10:00:00Z"),
  });
}

describe("http provider", () => {
  it("calls the proxy contract and normalises quotes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        quote: {
          price: 182.5,
          currency: "EUR",
          asOf: "2026-11-02T09:58:00Z",
          status: "delayed",
          previousClose: 180,
          exchange: "XETR",
        },
      }),
    );
    const quote = await http(fetchImpl as unknown as typeof fetch).getQuote("SAP:XETR");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://proxy.example/v1/quote?id=SAP%3AXETR",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    expect(quote).toMatchObject({
      instrumentId: "SAP:XETR",
      price: 182.5,
      status: "delayed",
      fetchedAt: "2026-11-02T10:00:00.000Z",
      providerId: "market",
      exchange: "XETR",
    });
  });

  it("never accepts 'demo' or unknown statuses from the network", async () => {
    const provider = http((async () =>
      jsonResponse({
        quote: { price: 1, currency: "EUR", asOf: "2026-11-02T09:58:00Z", status: "live" },
      })) as unknown as typeof fetch);
    await expect(provider.getQuote("X")).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("maps HTTP errors to error kinds", async () => {
    const cases: [Response, string, number?][] = [
      [jsonResponse({}, { status: 429, headers: { "Retry-After": "30" } }), "rate-limit", 30],
      [
        jsonResponse({ error: { kind: "unsupported", message: "USD" } }, { status: 422 }),
        "unsupported",
      ],
      [jsonResponse({}, { status: 404 }), "not-found"],
      [jsonResponse({}, { status: 502 }), "provider-error"],
      [new Response("<html>", { status: 200 }), "invalid-response"],
    ];
    for (const [response, kind, retry] of cases) {
      const error = await http((async () => response) as unknown as typeof fetch)
        .getQuote("X")
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(MarketDataError);
      expect((error as MarketDataError).kind).toBe(kind);
      if (retry !== undefined) expect((error as MarketDataError).retryAfterSeconds).toBe(retry);
    }
  });

  it("distinguishes offline from an unreachable provider", async () => {
    const failing = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    await expect(http(failing).getQuote("X")).rejects.toMatchObject({ kind: "provider-error" });
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      await expect(http(failing).getQuote("X")).rejects.toMatchObject({ kind: "offline" });
    } finally {
      spy.mockRestore();
    }
  });

  it("skips malformed search results", async () => {
    const provider = http((async () =>
      jsonResponse({
        results: [
          {
            id: "SAP:XETR",
            symbol: "SAP",
            name: "SAP SE",
            type: "stock",
            currency: "EUR",
            exchange: "XETR",
          },
          { id: "broken" },
        ],
      })) as unknown as typeof fetch);
    expect(await provider.searchInstruments("sap")).toEqual([
      {
        id: "SAP:XETR",
        symbol: "SAP",
        name: "SAP SE",
        type: "stock",
        currency: "EUR",
        exchange: "XETR",
      },
    ]);
  });
});

function countingProvider(behaviour: () => Promise<Quote>) {
  const getQuote = vi.fn(behaviour);
  const provider = {
    ...createDemoProvider(),
    mode: "market",
    getQuote,
  } as unknown as MarketDataProvider;
  return { provider, getQuote };
}

const sampleQuote: Quote = {
  instrumentId: "A",
  price: 10,
  currency: "EUR",
  asOf: "2026-11-02T09:00:00Z",
  asOfPrecision: "minute",
  fetchedAt: "2026-11-02T09:00:00Z",
  status: "delayed",
  providerId: "market",
};

describe("market data service", () => {
  it("caches quotes and shares concurrent requests", async () => {
    let now = 0;
    const { provider, getQuote } = countingProvider(async () => sampleQuote);
    const service = createMarketDataService(provider, () => now);
    await Promise.all([service.quote("A"), service.quote("A")]);
    await service.quote("A");
    expect(getQuote).toHaveBeenCalledTimes(1);
    now = 61_000;
    await service.quote("A");
    expect(getQuote).toHaveBeenCalledTimes(2);
    await service.quote("A", { force: true });
    expect(getQuote).toHaveBeenCalledTimes(3);
  });

  it("pauses after a rate limit instead of hammering the provider", async () => {
    let now = 0;
    const { provider, getQuote } = countingProvider(async () => {
      throw new MarketDataError("rate-limit", "", 20);
    });
    const service = createMarketDataService(provider, () => now);
    const result = await service.quotes(["A", "B", "C"]);
    expect(getQuote).toHaveBeenCalledTimes(1);
    expect(Object.values(result.errors).map((e) => e.kind)).toEqual([
      "rate-limit",
      "rate-limit",
      "rate-limit",
    ]);
    await expect(service.quote("D")).rejects.toMatchObject({ kind: "rate-limit" });
    expect(getQuote).toHaveBeenCalledTimes(1);
    expect(service.rateLimitRemainingMs()).toBe(20_000);
    now = 21_000;
    await expect(service.quote("D")).rejects.toMatchObject({ kind: "rate-limit" });
    expect(getQuote).toHaveBeenCalledTimes(2);
  });

  it("fails fast when offline for real providers", async () => {
    const { provider, getQuote } = countingProvider(async () => sampleQuote);
    const spy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    try {
      await expect(createMarketDataService(provider).quote("A")).rejects.toMatchObject({
        kind: "offline",
      });
      expect(getQuote).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe("quote status", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  const fetched = (minutesAgo: number, status: Quote["status"] = "delayed"): Quote => ({
    ...sampleQuote,
    status,
    fetchedAt: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
  });

  it("derives cached, stale and unavailable states", () => {
    expect(getDisplayStatus(undefined, now)).toBe("unavailable");
    expect(getDisplayStatus(fetched(5), now)).toBe("delayed");
    expect(getDisplayStatus(fetched(5, "eod"), now)).toBe("eod");
    expect(getDisplayStatus(fetched(20), now)).toBe("cached");
    expect(getDisplayStatus(fetched(60 * 25), now)).toBe("stale");
    expect(getDisplayStatus(fetched(60 * 25, "demo"), now)).toBe("demo");
  });

  it("only allows recent prices for orders", () => {
    expect(isQuoteUsableForOrder(fetched(5), now)).toBe(true);
    expect(isQuoteUsableForOrder(fetched(16), now)).toBe(false);
    expect(isQuoteUsableForOrder(undefined, now)).toBe(false);
    expect(needsRefresh(fetched(0, "demo"), now)).toBe(false);
  });
});

describe("proxy configuration", () => {
  it("accepts a public proxy URL and rejects URLs with secrets", () => {
    expect(resolveProxyUrl(undefined)).toBeNull();
    expect(resolveProxyUrl(" ")).toBeNull();
    expect(resolveProxyUrl("https://markt.example.org/api/")).toBe("https://markt.example.org/api");
    expect(() => resolveProxyUrl("https://x.example/?apikey=123")).toThrow(/API key/);
    expect(() => resolveProxyUrl("https://x.example/?token=123")).toThrow();
    expect(() => resolveProxyUrl("markt.example.org")).toThrow(/absolute/);
  });
});
