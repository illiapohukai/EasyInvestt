import type { Quote, QuoteStatus } from "@/lib/market-data/types";
import { parseInstrument } from "@/lib/market-data/http-provider";
import {
  DEPOT_VERSION,
  EMPTY_DEPOT,
  MAX_NOTE_LENGTH,
  MAX_TRANSACTIONS,
  type DepotState,
  type HeldInstrument,
  type PortfolioRecord,
  type PositionRecord,
  type SnapshotReason,
  type SnapshotRecord,
  type TransactionRecord,
} from "./types";

/**
 * Validation and migration of stored portfolio data.
 *
 * - Missing data -> empty state.
 * - Malformed financial data (portfolio, positions, transactions) -> the
 *   whole portfolio is discarded instead of being "repaired", because a
 *   half-valid ledger would show wrong numbers. The UI tells the user.
 * - Non-critical data (cached quotes, single snapshots) is dropped entry by entry.
 * - Older versions are migrated step by step (MIGRATIONS). Data from a newer
 *   app version is left untouched in storage (read-only) instead of being
 *   overwritten.
 */

export type DepotIssue = "malformed" | "unsupported-version" | "newer-version" | null;

export interface ParsedDepot {
  state: DepotState;
  issue: DepotIssue;
}

type Json = Record<string, unknown>;

/** Migration from version N (key) to N + 1. Add entries when the schema changes. */
export const MIGRATIONS: Record<number, (data: Json) => Json> = {};

const QUOTE_STATUSES: readonly QuoteStatus[] = ["realtime", "delayed", "eod", "demo"];
const SNAPSHOT_REASONS: readonly SnapshotReason[] = ["start", "buy", "sell", "refresh"];

class Invalid extends Error {}

function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  if (typeof value !== "string" || value === "") throw new Invalid();
  return value;
}

function iso(value: unknown): string {
  const text = str(value);
  if (!Number.isFinite(Date.parse(text))) throw new Invalid();
  return text;
}

function int(value: unknown, { min = 0 }: { min?: number } = {}): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) throw new Invalid();
  return value;
}

function signedInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Invalid();
  return value;
}

function positive(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Invalid();
  return value;
}

function heldInstrument(value: unknown): HeldInstrument {
  let instrument: HeldInstrument;
  try {
    instrument = parseInstrument(value);
  } catch {
    throw new Invalid();
  }
  if (isRecord(value) && value["fictional"] === true) instrument.fictional = true;
  // Descriptions are not stored with positions.
  const { description: _description, ...rest } = instrument as HeldInstrument & {
    description?: string;
  };
  return rest;
}

function position(value: unknown): PositionRecord {
  if (!isRecord(value)) throw new Invalid();
  return {
    instrument: heldInstrument(value["instrument"]),
    units: int(value["units"], { min: 1 }),
    costBasisCents: int(value["costBasisCents"]),
    openedAt: iso(value["openedAt"]),
    lastTradePrice: positive(value["lastTradePrice"]),
    lastTradeAt: iso(value["lastTradeAt"]),
  };
}

function transaction(value: unknown): TransactionRecord {
  if (!isRecord(value)) throw new Invalid();
  const type = value["type"];
  const status = value["priceStatus"];
  if ((type !== "buy" && type !== "sell") || !QUOTE_STATUSES.includes(status as QuoteStatus)) {
    throw new Invalid();
  }
  if (value["simulated"] !== true) throw new Invalid();
  const record: TransactionRecord = {
    id: str(value["id"]),
    type,
    at: iso(value["at"]),
    instrumentId: str(value["instrumentId"]),
    symbol: str(value["symbol"]),
    name: str(value["name"]),
    units: int(value["units"], { min: 1 }),
    price: positive(value["price"]),
    currency: str(value["currency"]),
    priceAsOf: iso(value["priceAsOf"]),
    priceStatus: status as QuoteStatus,
    amountCents: int(value["amountCents"]),
    costBasisCents: int(value["costBasisCents"]),
    realizedCents: signedInt(value["realizedCents"]),
    cashAfterCents: int(value["cashAfterCents"]),
    providerId: str(value["providerId"]),
    simulated: true,
  };
  const note = value["note"];
  if (typeof note === "string" && note.trim() !== "") record.note = note.slice(0, MAX_NOTE_LENGTH);
  return record;
}

function snapshot(value: unknown): SnapshotRecord | null {
  try {
    if (!isRecord(value)) return null;
    const reason = value["reason"];
    if (!SNAPSHOT_REASONS.includes(reason as SnapshotReason)) return null;
    const prices: Record<string, number> = {};
    const rawPrices = value["prices"];
    if (isRecord(rawPrices)) {
      for (const [id, price] of Object.entries(rawPrices)) {
        if (typeof price === "number" && Number.isFinite(price) && price > 0) prices[id] = price;
      }
    }
    return {
      at: iso(value["at"]),
      reason: reason as SnapshotReason,
      cashCents: int(value["cashCents"]),
      positionsValueCents: int(value["positionsValueCents"]),
      totalValueCents: int(value["totalValueCents"]),
      complete: value["complete"] === true,
      prices,
    };
  } catch {
    return null;
  }
}

function portfolio(value: unknown): PortfolioRecord {
  if (!isRecord(value)) throw new Invalid();
  const dataMode = value["dataMode"];
  if (value["baseCurrency"] !== "EUR" || (dataMode !== "demo" && dataMode !== "market")) {
    throw new Invalid();
  }
  const rawPositions = value["positions"];
  const rawTransactions = value["transactions"];
  const rawSnapshots = value["snapshots"];
  if (!Array.isArray(rawPositions) || !Array.isArray(rawTransactions)) throw new Invalid();

  const record: PortfolioRecord = {
    id: str(value["id"]),
    name: str(value["name"]).slice(0, 40),
    createdAt: iso(value["createdAt"]),
    baseCurrency: "EUR",
    providerId: str(value["providerId"]),
    dataMode,
    startingCashCents: int(value["startingCashCents"], { min: 1 }),
    cashCents: int(value["cashCents"]),
    positions: rawPositions.map(position),
    transactions: rawTransactions.map(transaction),
    snapshots: Array.isArray(rawSnapshots)
      ? rawSnapshots.map(snapshot).filter((s): s is SnapshotRecord => s !== null)
      : [],
  };

  const ids = record.positions.map((p) => p.instrument.id);
  if (new Set(ids).size !== ids.length) throw new Invalid();

  // Ledger check: cash must equal the starting balance minus purchases plus
  // sale proceeds. Skipped once old transactions have been trimmed.
  if (record.transactions.length < MAX_TRANSACTIONS) {
    const expectedCash = record.transactions.reduce(
      (cash, t) => cash + (t.type === "sell" ? t.amountCents : -t.amountCents),
      record.startingCashCents,
    );
    if (expectedCash !== record.cashCents) throw new Invalid();
  }
  return record;
}

function quotes(value: unknown): Record<string, Quote> {
  const result: Record<string, Quote> = {};
  if (!isRecord(value)) return result;
  for (const [id, raw] of Object.entries(value)) {
    try {
      if (!isRecord(raw)) continue;
      const status = raw["status"];
      if (!QUOTE_STATUSES.includes(status as QuoteStatus)) continue;
      const quote: Quote = {
        instrumentId: str(raw["instrumentId"]),
        price: positive(raw["price"]),
        currency: str(raw["currency"]),
        asOf: iso(raw["asOf"]),
        asOfPrecision: raw["asOfPrecision"] === "day" ? "day" : "minute",
        fetchedAt: iso(raw["fetchedAt"]),
        status: status as QuoteStatus,
        providerId: str(raw["providerId"]),
      };
      if (quote.instrumentId !== id) continue;
      for (const key of ["previousClose", "change", "changePercent"] as const) {
        const entry = raw[key];
        if (typeof entry === "number" && Number.isFinite(entry)) quote[key] = entry;
      }
      if (typeof raw["exchange"] === "string") quote.exchange = raw["exchange"];
      result[id] = quote;
    } catch {
      // Ignore a single broken cache entry.
    }
  }
  return result;
}

export function parseDepotState(raw: unknown): ParsedDepot {
  if (raw === null || raw === undefined) return { state: EMPTY_DEPOT, issue: null };
  if (!isRecord(raw) || typeof raw["version"] !== "number") {
    return { state: EMPTY_DEPOT, issue: "malformed" };
  }

  let data: Json = raw;
  let version = raw["version"];
  if (version > DEPOT_VERSION) return { state: EMPTY_DEPOT, issue: "newer-version" };
  while (version < DEPOT_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) return { state: EMPTY_DEPOT, issue: "unsupported-version" };
    data = migrate(data);
    version += 1;
  }

  try {
    const lastRefreshAt = data["lastRefreshAt"];
    return {
      state: {
        version: DEPOT_VERSION,
        portfolio:
          data["portfolio"] === null || data["portfolio"] === undefined
            ? null
            : portfolio(data["portfolio"]),
        quotes: quotes(data["quotes"]),
        lastRefreshAt:
          typeof lastRefreshAt === "string" && Number.isFinite(Date.parse(lastRefreshAt))
            ? lastRefreshAt
            : null,
      },
      issue: null,
    };
  } catch {
    return { state: EMPTY_DEPOT, issue: "malformed" };
  }
}
