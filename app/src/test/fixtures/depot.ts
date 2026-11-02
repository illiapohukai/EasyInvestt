import type { Instrument, Quote } from "@/lib/market-data/types";

export const NOW = new Date("2026-11-02T10:00:00.000Z");

export function instrument(overrides: Partial<Instrument> = {}): Instrument {
  return {
    id: "test-etf",
    symbol: "TETF",
    name: "Test-ETF",
    type: "etf",
    currency: "EUR",
    ...overrides,
  };
}

export function quote(instrumentId: string, price: number, overrides: Partial<Quote> = {}): Quote {
  return {
    instrumentId,
    price,
    currency: "EUR",
    asOf: "2026-11-02T09:55:00.000Z",
    asOfPrecision: "minute",
    fetchedAt: NOW.toISOString(),
    status: "delayed",
    providerId: "test",
    ...overrides,
  };
}
