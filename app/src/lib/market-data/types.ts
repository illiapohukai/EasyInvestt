/**
 * Provider-independent market-data types.
 *
 * UI components only depend on these types and on the MarketDataProvider
 * interface – never on a concrete provider. A provider is either the built-in
 * demo adapter (sample data) or the HTTP adapter that talks to a server-side
 * proxy (see server/market-data-proxy and README "Marktdaten").
 */

export type AssetType = "etf" | "bond-etf" | "stock";

/**
 * Quality of a price as delivered by the provider.
 * - realtime: the provider explicitly delivers real-time prices
 * - delayed: intraday price that may be delayed
 * - eod: end-of-day / last closing price
 * - demo: sample data from the demo adapter, not a market price
 */
export type QuoteStatus = "realtime" | "delayed" | "eod" | "demo";

/** Status shown in the UI. Adds client-side states to QuoteStatus. */
export type DisplayQuoteStatus = QuoteStatus | "cached" | "stale" | "unavailable";

export type TimestampPrecision = "day" | "minute";

export interface ProviderInfo {
  id: string;
  name: string;
  url?: string;
}

export interface Instrument {
  /** Provider-specific, stable identifier, e.g. "SAP:XETR" or "demo-welt". */
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  /** Price currency (ISO 4217), e.g. "EUR". */
  currency: string;
  exchange?: string;
  country?: string;
  /** Industry sector, only for single stocks and only if the provider knows it. */
  sector?: string;
  /** Region a fund invests in, e.g. "Welt". */
  region?: string;
  /** Approximate number of holdings for funds. */
  holdingsCount?: number;
  /** True for fictional demo instruments. */
  fictional?: boolean;
}

export interface InstrumentDetails extends Instrument {
  /** Short neutral description. Never an investment recommendation. */
  description?: string;
}

export interface Quote {
  instrumentId: string;
  price: number;
  currency: string;
  /** ISO timestamp of the price (last trade or close). */
  asOf: string;
  asOfPrecision: TimestampPrecision;
  /** ISO timestamp when the app received the quote. */
  fetchedAt: string;
  status: QuoteStatus;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  exchange?: string;
  providerId: string;
}

export type HistoryRange = "1M" | "6M" | "1J";

export interface PricePoint {
  /** ISO date (YYYY-MM-DD) of the closing price. */
  date: string;
  close: number;
}

export interface PriceHistory {
  instrumentId: string;
  currency: string;
  range: HistoryRange;
  status: QuoteStatus;
  points: PricePoint[];
  providerId: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  asOf: string;
  providerId: string;
}

export interface MarketDataProvider {
  readonly info: ProviderInfo;
  /** "demo" for sample data; "market" for data from a real provider. */
  readonly mode: "demo" | "market";
  searchInstruments(query: string, signal?: AbortSignal): Promise<Instrument[]>;
  getQuote(instrumentId: string, signal?: AbortSignal): Promise<Quote>;
  getHistoricalPrices(
    instrumentId: string,
    range: HistoryRange,
    signal?: AbortSignal,
  ): Promise<PriceHistory>;
  getInstrumentDetails(instrumentId: string, signal?: AbortSignal): Promise<InstrumentDetails>;
  getExchangeRate(from: string, to: string, signal?: AbortSignal): Promise<ExchangeRate>;
}
