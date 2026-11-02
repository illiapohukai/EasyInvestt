// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createProxy, mapAssetType } from "./handler";

const ORIGIN = "https://example.github.io";
const KEY = "test-key-123";

function upstreamJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function setup(responses: Array<Response | (() => Response)>, env: Record<string, string> = {}) {
  let now = Date.parse("2026-11-02T10:00:00Z");
  const fetchImpl = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("unexpected upstream call");
    return typeof next === "function" ? next() : next;
  });
  const handle = createProxy({
    env: { TWELVE_DATA_API_KEY: KEY, ALLOWED_ORIGINS: ORIGIN, ...env },
    fetchImpl: fetchImpl as unknown as typeof fetch,
    clock: () => new Date(now),
  });
  const get = (path: string, origin: string | null = ORIGIN) =>
    handle(new Request(`https://proxy.test${path}`, { headers: origin ? { Origin: origin } : {} }));
  return { get, fetchImpl, advance: (ms: number) => (now += ms) };
}

const SAP_QUOTE = {
  symbol: "SAP",
  name: "SAP SE",
  exchange: "XETR",
  mic_code: "XETR",
  currency: "EUR",
  datetime: "2026-11-02",
  timestamp: 1793606400,
  last_quote_at: 1793613480,
  close: "182.50",
  previous_close: "180.00",
  change: "2.50",
  percent_change: "1.38889",
  is_market_open: true,
};

describe("market-data proxy", () => {
  it("maps vendor instrument types and filters unsupported ones", () => {
    expect(mapAssetType("Common Stock", "SAP SE")).toBe("stock");
    expect(mapAssetType("ETF", "iShares Core MSCI World")).toBe("etf");
    expect(mapAssetType("ETF", "iShares Core Euro Government Bond")).toBe("bond-etf");
    expect(mapAssetType("Warrant", "Something")).toBeNull();
  });

  it("sends the key only in the Authorization header", async () => {
    const { get, fetchImpl } = setup([upstreamJson(SAP_QUOTE)]);
    const response = await get("/v1/quote?id=SAP:XETR");
    expect(response.status).toBe(200);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.twelvedata.com/quote?symbol=SAP&mic_code=XETR");
    expect(url).not.toContain(KEY);
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(`apikey ${KEY}`);
    const text = await response.clone().text();
    expect(text).not.toContain(KEY);
  });

  it("translates a quote into the internal contract", async () => {
    const { get } = setup([upstreamJson(SAP_QUOTE)]);
    const body = await (await get("/v1/quote?id=sap:xetr")).json();
    expect(body.quote).toEqual({
      price: 182.5,
      currency: "EUR",
      asOf: new Date(1793613480 * 1000).toISOString(),
      asOfPrecision: "minute",
      status: "delayed",
      exchange: "XETR",
      previousClose: 180,
      change: 2.5,
      changePercent: 1.38889,
    });
  });

  it("reports closing prices as eod and realtime only when configured", async () => {
    const closed = setup([upstreamJson({ ...SAP_QUOTE, is_market_open: false })]);
    expect((await (await closed.get("/v1/quote?id=SAP:XETR")).json()).quote.status).toBe("eod");
    const realtime = setup([upstreamJson(SAP_QUOTE)], { OPEN_MARKET_STATUS: "realtime" });
    expect((await (await realtime.get("/v1/quote?id=SAP:XETR")).json()).quote.status).toBe(
      "realtime",
    );
  });

  it("caches quotes for a minute", async () => {
    const { get, fetchImpl, advance } = setup([upstreamJson(SAP_QUOTE), upstreamJson(SAP_QUOTE)]);
    await get("/v1/quote?id=SAP:XETR");
    await get("/v1/quote?id=SAP:XETR");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    advance(61_000);
    await get("/v1/quote?id=SAP:XETR");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("maps vendor rate limits to 429 with Retry-After and pauses upstream calls", async () => {
    const { get, fetchImpl } = setup([
      upstreamJson({ status: "error", code: 429, message: "limit" }, 200),
    ]);
    const first = await get("/v1/quote?id=SAP:XETR");
    expect(first.status).toBe(429);
    expect(first.headers.get("Retry-After")).toBe("60");
    expect((await first.json()).error.kind).toBe("rate-limit");
    const second = await get("/v1/quote?id=BAS:XETR");
    expect(second.status).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("enforces its own upstream budget", async () => {
    const { get, fetchImpl } = setup(
      [upstreamJson(SAP_QUOTE), upstreamJson({ ...SAP_QUOTE, symbol: "BAS" })],
      { UPSTREAM_CALLS_PER_MINUTE: "1" },
    );
    expect((await get("/v1/quote?id=SAP:XETR")).status).toBe(200);
    const limited = await get("/v1/quote?id=BAS:XETR");
    expect(limited.status).toBe(429);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not forward vendor error messages", async () => {
    const { get } = setup([
      upstreamJson({ status: "error", code: 401, message: `bad apikey ${KEY}` }, 401),
    ]);
    const response = await get("/v1/quote?id=SAP:XETR");
    expect(response.status).toBe(422);
    const text = await response.text();
    expect(text).toContain("unsupported");
    expect(text).not.toContain(KEY);
  });

  it("maps upstream outages to provider-error", async () => {
    const { get } = setup([
      () => {
        throw new TypeError("network down");
      },
    ]);
    const response = await get("/v1/quote?id=SAP:XETR");
    expect(response.status).toBe(502);
    expect((await response.json()).error.kind).toBe("provider-error");
  });

  it("validates ids and ranges before calling the vendor", async () => {
    const { get, fetchImpl } = setup([]);
    expect((await get("/v1/quote?id=SAP")).status).toBe(400);
    expect((await get("/v1/quote?id=SAP:XETR%26apikey=x")).status).toBe(400);
    expect((await get("/v1/history?id=SAP:XETR&range=5J")).status).toBe(400);
    expect((await get("/v1/unknown")).status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("only answers allowed origins", async () => {
    const { get } = setup([upstreamJson(SAP_QUOTE)]);
    const denied = await get("/v1/quote?id=SAP:XETR", "https://evil.example");
    expect(denied.status).toBe(403);
    const allowed = await get("/v1/quote?id=SAP:XETR");
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });

  it("returns 503 without a configured key", async () => {
    const handle = createProxy({
      env: { ALLOWED_ORIGINS: ORIGIN },
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const response = await handle(new Request("https://proxy.test/v1/quote?id=SAP:XETR"));
    expect(response.status).toBe(503);
  });

  it("maps search results and drops unsupported instrument types", async () => {
    const { get } = setup([
      upstreamJson({
        status: "ok",
        data: [
          {
            symbol: "SAP",
            instrument_name: "SAP SE",
            exchange: "XETR",
            mic_code: "XETR",
            instrument_type: "Common Stock",
            country: "Germany",
            currency: "EUR",
          },
          {
            symbol: "SAP",
            instrument_name: "SAP SE",
            exchange: "NYSE",
            mic_code: "XNYS",
            instrument_type: "Common Stock",
            country: "United States",
            currency: "USD",
          },
          {
            symbol: "SAPX",
            instrument_name: "SAP Warrant",
            exchange: "XETR",
            mic_code: "XETR",
            instrument_type: "Warrant",
            currency: "EUR",
          },
        ],
      }),
    ]);
    const body = await (await get("/v1/search?q=SAP")).json();
    expect(body.results).toEqual([
      {
        id: "SAP:XETR",
        symbol: "SAP",
        name: "SAP SE",
        type: "stock",
        currency: "EUR",
        exchange: "XETR",
        country: "Germany",
      },
      {
        id: "SAP:XNYS",
        symbol: "SAP",
        name: "SAP SE",
        type: "stock",
        currency: "USD",
        exchange: "NYSE",
        country: "United States",
      },
    ]);
  });

  it("returns daily history in ascending order", async () => {
    const { get } = setup([
      upstreamJson({
        meta: { symbol: "SAP", currency: "EUR" },
        values: [
          { datetime: "2026-10-30", close: "181.00" },
          { datetime: "2026-10-29", close: "179.50" },
          { datetime: "2026-10-28", close: "bad" },
        ],
        status: "ok",
      }),
    ]);
    const body = await (await get("/v1/history?id=SAP:XETR&range=1M")).json();
    expect(body.history).toEqual({
      currency: "EUR",
      status: "eod",
      points: [
        { date: "2026-10-29", close: 179.5 },
        { date: "2026-10-30", close: 181 },
      ],
    });
  });
});
