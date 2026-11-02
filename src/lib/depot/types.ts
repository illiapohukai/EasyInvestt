import type { Instrument, Quote, QuoteStatus } from "@/lib/market-data/types";

/**
 * Data model of the practice portfolio ("Übungsdepot").
 *
 * Money is stored as integer euro cents and quantities as integer units of
 * 1/10,000 share, so repeated purchases and sales never accumulate
 * floating-point errors. Prices are stored as provided (euro per share).
 */

/** Quantities are stored in units of 1/10,000 share (fractional shares, max. 4 decimals). */
export const UNITS_PER_SHARE = 10_000;
export const SHARE_DECIMALS = 4;
/** Smallest virtual order: 1 €. */
export const MIN_ORDER_CENTS = 100;
export const STARTING_CASH_PRESETS_CENTS = [100_000, 500_000, 1_000_000] as const;
export const MAX_STARTING_CASH_CENTS = 100_000_000;
export const MAX_SNAPSHOTS = 500;
export const MAX_TRANSACTIONS = 2_000;
export const MAX_NOTE_LENGTH = 280;
export const DEFAULT_PORTFOLIO_NAME = "Mein Übungsdepot";

export type DataMode = "demo" | "market";

/** Instrument metadata copied into the portfolio at purchase time. */
export type HeldInstrument = Instrument;

export interface PositionRecord {
  instrument: HeldInstrument;
  units: number;
  /** Total purchase cost of the units still held (average-cost method). */
  costBasisCents: number;
  openedAt: string;
  lastTradePrice: number;
  lastTradeAt: string;
}

export interface TransactionRecord {
  id: string;
  type: "buy" | "sell";
  at: string;
  instrumentId: string;
  symbol: string;
  name: string;
  units: number;
  /** Price per share used for the simulation. */
  price: number;
  currency: string;
  priceAsOf: string;
  priceStatus: QuoteStatus;
  /** Purchase cost (buy) or proceeds (sell). */
  amountCents: number;
  /** Cost basis added (buy) or removed (sell). */
  costBasisCents: number;
  /** Realised gain or loss of a sale; 0 for purchases. */
  realizedCents: number;
  cashAfterCents: number;
  providerId: string;
  /** Every transaction is a simulation. Stored explicitly for exports. */
  simulated: true;
  /** Optional reflection written by the user. */
  note?: string;
}

export type SnapshotReason = "start" | "buy" | "sell" | "refresh";

export interface SnapshotRecord {
  at: string;
  reason: SnapshotReason;
  cashCents: number;
  positionsValueCents: number;
  totalValueCents: number;
  /** False when at least one position was valued without a current quote. */
  complete: boolean;
  /** Price per instrument used for this snapshot. */
  prices: Record<string, number>;
}

export interface PortfolioRecord {
  id: string;
  name: string;
  createdAt: string;
  baseCurrency: "EUR";
  providerId: string;
  dataMode: DataMode;
  startingCashCents: number;
  cashCents: number;
  positions: PositionRecord[];
  transactions: TransactionRecord[];
  snapshots: SnapshotRecord[];
}

export const DEPOT_STORAGE_KEY = "geldstart.depot";
export const DEPOT_VERSION = 1;

export interface DepotState {
  version: typeof DEPOT_VERSION;
  portfolio: PortfolioRecord | null;
  /** Last known quote per instrument ("zwischengespeichert"). */
  quotes: Record<string, Quote>;
  /** Last successful manual or automatic refresh. */
  lastRefreshAt: string | null;
}

export const EMPTY_DEPOT: DepotState = Object.freeze({
  version: DEPOT_VERSION,
  portfolio: null,
  quotes: Object.freeze({}) as Record<string, Quote>,
  lastRefreshAt: null,
}) as DepotState;
