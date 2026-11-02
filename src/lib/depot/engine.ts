import type { Instrument, Quote } from "@/lib/market-data/types";
import { averagePrice, valueCents } from "./money";
import {
  DEFAULT_PORTFOLIO_NAME,
  MAX_NOTE_LENGTH,
  MAX_SNAPSHOTS,
  MAX_STARTING_CASH_CENTS,
  MAX_TRANSACTIONS,
  MIN_ORDER_CENTS,
  type DataMode,
  type PortfolioRecord,
  type PositionRecord,
  type SnapshotReason,
  type SnapshotRecord,
  type TransactionRecord,
} from "./types";

/**
 * Pure calculation rules of the practice portfolio. No React, no storage.
 *
 * Performance baseline: the virtual starting balance. There are no further
 * deposits, fees, taxes or currency effects (only EUR instruments), so
 *   total value = cash + market value of all positions
 *   total gain  = total value − starting balance = realised + unrealised gain
 */

export type OrderErrorCode =
  | "invalid-portfolio"
  | "invalid-amount"
  | "invalid-units"
  | "below-minimum"
  | "insufficient-cash"
  | "oversell"
  | "no-position"
  | "missing-price"
  | "unsupported-currency"
  | "instrument-mismatch";

export class OrderError extends Error {
  readonly code: OrderErrorCode;
  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.name = "OrderError";
    this.code = code;
  }
}

const SUPPORTED_CURRENCY = "EUR";

function assertInteger(value: number, code: OrderErrorCode, message: string) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new OrderError(code, message);
}

function assertPrice(quote: Quote | undefined, instrument: Instrument): asserts quote is Quote {
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    throw new OrderError("missing-price", "Für dieses Wertpapier liegt kein Kurs vor.");
  }
  if (quote.instrumentId !== instrument.id) {
    throw new OrderError("instrument-mismatch", "Der Kurs gehört zu einem anderen Wertpapier.");
  }
  if (quote.currency !== SUPPORTED_CURRENCY || instrument.currency !== SUPPORTED_CURRENCY) {
    throw new OrderError(
      "unsupported-currency",
      `Das Übungsdepot unterstützt bisher nur Wertpapiere in Euro (dieses notiert in ${quote.currency}).`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Portfolio creation                                                  */
/* ------------------------------------------------------------------ */

export interface CreatePortfolioInput {
  id: string;
  name: string;
  startingCashCents: number;
  providerId: string;
  dataMode: DataMode;
  now: Date;
}

export function createPortfolio(input: CreatePortfolioInput): PortfolioRecord {
  if (
    !Number.isSafeInteger(input.startingCashCents) ||
    input.startingCashCents <= 0 ||
    input.startingCashCents > MAX_STARTING_CASH_CENTS
  ) {
    throw new OrderError("invalid-portfolio", "Ungültiges Startguthaben.");
  }
  const at = input.now.toISOString();
  const name = input.name.trim().slice(0, 40) || DEFAULT_PORTFOLIO_NAME;
  return {
    id: input.id,
    name,
    createdAt: at,
    baseCurrency: "EUR",
    providerId: input.providerId,
    dataMode: input.dataMode,
    startingCashCents: input.startingCashCents,
    cashCents: input.startingCashCents,
    positions: [],
    transactions: [],
    snapshots: [
      {
        at,
        reason: "start",
        cashCents: input.startingCashCents,
        positionsValueCents: 0,
        totalValueCents: input.startingCashCents,
        complete: true,
        prices: {},
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Buying                                                              */
/* ------------------------------------------------------------------ */

export type BuyRequest = { kind: "amount"; amountCents: number } | { kind: "units"; units: number };

export interface BuyOrder {
  instrument: Instrument;
  quote: Quote;
  units: number;
  price: number;
  amountCents: number;
  cashAfterCents: number;
}

/** Validates a purchase and calculates quantity and cost. Throws OrderError. */
export function prepareBuy(
  portfolio: PortfolioRecord,
  instrument: Instrument,
  quote: Quote | undefined,
  request: BuyRequest,
): BuyOrder {
  assertPrice(quote, instrument);
  const price = quote.price;
  let units: number;

  if (request.kind === "amount") {
    assertInteger(request.amountCents, "invalid-amount", "Bitte gib einen gültigen Betrag ein.");
    // Largest quantity (in 1/10,000 shares) that the amount can pay for.
    units = Math.floor((request.amountCents * 100) / price + 1e-9);
    while (units > 0 && valueCents(units, price) > request.amountCents) units -= 1;
    if (units <= 0) {
      throw new OrderError(
        "below-minimum",
        "Der Betrag reicht nicht für den kleinsten möglichen Anteil (0,0001 Stück).",
      );
    }
  } else {
    assertInteger(request.units, "invalid-units", "Bitte gib eine gültige Stückzahl ein.");
    units = request.units;
  }

  const amountCents = valueCents(units, price);
  if (amountCents < MIN_ORDER_CENTS) {
    throw new OrderError("below-minimum", "Eine virtuelle Order muss mindestens 1 € groß sein.");
  }
  if (amountCents > portfolio.cashCents) {
    throw new OrderError(
      "insufficient-cash",
      "Dafür reicht dein virtuelles Guthaben nicht. Wähle einen kleineren Betrag.",
    );
  }
  return {
    instrument,
    quote,
    units,
    price,
    amountCents,
    cashAfterCents: portfolio.cashCents - amountCents,
  };
}

function capTransactions(transactions: TransactionRecord[]): TransactionRecord[] {
  return transactions.length > MAX_TRANSACTIONS
    ? transactions.slice(transactions.length - MAX_TRANSACTIONS)
    : transactions;
}

/** Applies a prepared purchase. Re-validates against the current portfolio. */
export function applyBuy(
  portfolio: PortfolioRecord,
  order: BuyOrder,
  now: Date,
  transactionId: string,
): { portfolio: PortfolioRecord; transaction: TransactionRecord } {
  // Recalculate with the order's own price to guard against stale previews.
  const checked = prepareBuy(portfolio, order.instrument, order.quote, {
    kind: "units",
    units: order.units,
  });
  const at = now.toISOString();
  const existing = portfolio.positions.find((p) => p.instrument.id === order.instrument.id);
  const position: PositionRecord = existing
    ? {
        ...existing,
        instrument: { ...existing.instrument, ...order.instrument },
        units: existing.units + checked.units,
        costBasisCents: existing.costBasisCents + checked.amountCents,
        lastTradePrice: checked.price,
        lastTradeAt: at,
      }
    : {
        instrument: order.instrument,
        units: checked.units,
        costBasisCents: checked.amountCents,
        openedAt: at,
        lastTradePrice: checked.price,
        lastTradeAt: at,
      };

  const transaction: TransactionRecord = {
    id: transactionId,
    type: "buy",
    at,
    instrumentId: order.instrument.id,
    symbol: order.instrument.symbol,
    name: order.instrument.name,
    units: checked.units,
    price: checked.price,
    currency: checked.quote.currency,
    priceAsOf: checked.quote.asOf,
    priceStatus: checked.quote.status,
    amountCents: checked.amountCents,
    costBasisCents: checked.amountCents,
    realizedCents: 0,
    cashAfterCents: checked.cashAfterCents,
    providerId: checked.quote.providerId,
    simulated: true,
  };

  return {
    portfolio: {
      ...portfolio,
      cashCents: checked.cashAfterCents,
      positions: existing
        ? portfolio.positions.map((p) => (p === existing ? position : p))
        : [...portfolio.positions, position],
      transactions: capTransactions([...portfolio.transactions, transaction]),
    },
    transaction,
  };
}

/* ------------------------------------------------------------------ */
/* Selling                                                             */
/* ------------------------------------------------------------------ */

export interface SellOrder {
  instrument: Instrument;
  quote: Quote;
  units: number;
  price: number;
  proceedsCents: number;
  /** Share of the cost basis that leaves the portfolio. */
  costBasisCents: number;
  realizedCents: number;
  remainingUnits: number;
  cashAfterCents: number;
}

/** Validates a sale. Selling more than the held quantity is never possible. */
export function prepareSell(
  portfolio: PortfolioRecord,
  instrumentId: string,
  quote: Quote | undefined,
  units: number,
): SellOrder {
  const position = portfolio.positions.find((p) => p.instrument.id === instrumentId);
  if (!position) {
    throw new OrderError("no-position", "Dieses Wertpapier ist nicht in deinem Depot.");
  }
  assertPrice(quote, position.instrument);
  assertInteger(units, "invalid-units", "Bitte gib eine gültige Stückzahl ein.");
  if (units > position.units) {
    throw new OrderError(
      "oversell",
      "Du kannst nicht mehr verkaufen, als du besitzt. Leerverkäufe sind im Übungsdepot nicht möglich.",
    );
  }
  const proceedsCents = valueCents(units, quote.price);
  const costBasisCents =
    units === position.units
      ? position.costBasisCents
      : Math.round((position.costBasisCents * units) / position.units);
  return {
    instrument: position.instrument,
    quote,
    units,
    price: quote.price,
    proceedsCents,
    costBasisCents,
    realizedCents: proceedsCents - costBasisCents,
    remainingUnits: position.units - units,
    cashAfterCents: portfolio.cashCents + proceedsCents,
  };
}

export function applySell(
  portfolio: PortfolioRecord,
  order: SellOrder,
  now: Date,
  transactionId: string,
): { portfolio: PortfolioRecord; transaction: TransactionRecord } {
  const checked = prepareSell(portfolio, order.instrument.id, order.quote, order.units);
  const at = now.toISOString();
  const positions = portfolio.positions.flatMap((p): PositionRecord[] => {
    if (p.instrument.id !== order.instrument.id) return [p];
    if (checked.remainingUnits === 0) return [];
    return [
      {
        ...p,
        units: checked.remainingUnits,
        costBasisCents: p.costBasisCents - checked.costBasisCents,
        lastTradePrice: checked.price,
        lastTradeAt: at,
      },
    ];
  });

  const transaction: TransactionRecord = {
    id: transactionId,
    type: "sell",
    at,
    instrumentId: checked.instrument.id,
    symbol: checked.instrument.symbol,
    name: checked.instrument.name,
    units: checked.units,
    price: checked.price,
    currency: checked.quote.currency,
    priceAsOf: checked.quote.asOf,
    priceStatus: checked.quote.status,
    amountCents: checked.proceedsCents,
    costBasisCents: checked.costBasisCents,
    realizedCents: checked.realizedCents,
    cashAfterCents: checked.cashAfterCents,
    providerId: checked.quote.providerId,
    simulated: true,
  };

  return {
    portfolio: {
      ...portfolio,
      cashCents: checked.cashAfterCents,
      positions,
      transactions: capTransactions([...portfolio.transactions, transaction]),
    },
    transaction,
  };
}

/* ------------------------------------------------------------------ */
/* Valuation                                                           */
/* ------------------------------------------------------------------ */

export interface PositionValuation {
  position: PositionRecord;
  /** Quote used for the valuation, if a usable one exists. */
  quote: Quote | undefined;
  price: number;
  /** "last-trade": no usable quote, valued at the last simulated trade price. */
  priceSource: "quote" | "last-trade";
  valueCents: number;
  unrealizedCents: number;
  /** Null when the cost basis is 0. */
  unrealizedPercent: number | null;
  averagePrice: number;
  /** Share of the total portfolio value (cash included), in percent. */
  weightPercent: number;
}

export interface PortfolioValuation {
  startingCashCents: number;
  cashCents: number;
  positions: PositionValuation[];
  positionsValueCents: number;
  totalValueCents: number;
  /** Purchase cost of all positions still held. */
  costBasisCents: number;
  unrealizedCents: number;
  realizedCents: number;
  /** realised + unrealised = total value − starting balance */
  totalGainCents: number;
  /** Total gain relative to the starting balance, in percent. Null for a zero baseline. */
  performancePercent: number | null;
  cashWeightPercent: number;
  /** False when at least one position has no usable quote. */
  complete: boolean;
  missingQuoteCount: number;
}

function percentOf(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export function totalRealizedCents(transactions: readonly TransactionRecord[]): number {
  return transactions.reduce((sum, t) => sum + (t.type === "sell" ? t.realizedCents : 0), 0);
}

export function valuePortfolio(
  portfolio: PortfolioRecord,
  quotes: Readonly<Record<string, Quote>>,
): PortfolioValuation {
  const draft = portfolio.positions.map((position) => {
    const candidate = quotes[position.instrument.id];
    const usable =
      candidate !== undefined &&
      Number.isFinite(candidate.price) &&
      candidate.price > 0 &&
      candidate.currency === SUPPORTED_CURRENCY;
    const price = usable ? candidate.price : position.lastTradePrice;
    const value = valueCents(position.units, price);
    return {
      position,
      quote: usable ? candidate : undefined,
      price,
      priceSource: usable ? ("quote" as const) : ("last-trade" as const),
      valueCents: value,
      unrealizedCents: value - position.costBasisCents,
      unrealizedPercent:
        position.costBasisCents > 0
          ? ((value - position.costBasisCents) / position.costBasisCents) * 100
          : null,
      averagePrice: averagePrice(position.costBasisCents, position.units),
    };
  });

  const positionsValueCents = draft.reduce((sum, p) => sum + p.valueCents, 0);
  const costBasisCents = draft.reduce((sum, p) => sum + p.position.costBasisCents, 0);
  const totalValueCents = portfolio.cashCents + positionsValueCents;
  const unrealizedCents = positionsValueCents - costBasisCents;
  const realizedCents = totalRealizedCents(portfolio.transactions);
  const totalGainCents = totalValueCents - portfolio.startingCashCents;
  const missingQuoteCount = draft.filter((p) => p.priceSource === "last-trade").length;

  return {
    startingCashCents: portfolio.startingCashCents,
    cashCents: portfolio.cashCents,
    positions: draft
      .map((p) => ({ ...p, weightPercent: percentOf(p.valueCents, totalValueCents) }))
      .sort((a, b) => b.valueCents - a.valueCents),
    positionsValueCents,
    totalValueCents,
    costBasisCents,
    unrealizedCents,
    realizedCents,
    totalGainCents,
    performancePercent:
      portfolio.startingCashCents > 0 ? (totalGainCents / portfolio.startingCashCents) * 100 : null,
    cashWeightPercent: percentOf(portfolio.cashCents, totalValueCents),
    complete: missingQuoteCount === 0,
    missingQuoteCount,
  };
}

/* ------------------------------------------------------------------ */
/* Snapshots and notes                                                 */
/* ------------------------------------------------------------------ */

function sameLocalDay(a: string, b: string): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

/**
 * Records the current portfolio value. Refresh snapshots of the same day are
 * replaced, so frequent refreshes do not flood the history; transaction
 * snapshots are always kept.
 */
export function appendSnapshot(
  portfolio: PortfolioRecord,
  valuation: PortfolioValuation,
  reason: SnapshotReason,
  now: Date,
): PortfolioRecord {
  const snapshot: SnapshotRecord = {
    at: now.toISOString(),
    reason,
    cashCents: valuation.cashCents,
    positionsValueCents: valuation.positionsValueCents,
    totalValueCents: valuation.totalValueCents,
    complete: valuation.complete,
    prices: Object.fromEntries(valuation.positions.map((p) => [p.position.instrument.id, p.price])),
  };
  const previous = portfolio.snapshots.at(-1);
  const replace =
    reason === "refresh" &&
    previous?.reason === "refresh" &&
    sameLocalDay(previous.at, snapshot.at);
  const snapshots = replace
    ? [...portfolio.snapshots.slice(0, -1), snapshot]
    : [...portfolio.snapshots, snapshot];
  // Keep the first snapshot (start of the history) when trimming.
  const trimmed =
    snapshots.length > MAX_SNAPSHOTS
      ? [snapshots[0] as SnapshotRecord, ...snapshots.slice(snapshots.length - MAX_SNAPSHOTS + 1)]
      : snapshots;
  return { ...portfolio, snapshots: trimmed };
}

export function withTransactionNote(
  portfolio: PortfolioRecord,
  transactionId: string,
  note: string,
): PortfolioRecord {
  const cleaned = note.trim().slice(0, MAX_NOTE_LENGTH);
  return {
    ...portfolio,
    transactions: portfolio.transactions.map((t) => {
      if (t.id !== transactionId) return t;
      if (cleaned === "") {
        const { note: _removed, ...rest } = t;
        return rest;
      }
      return { ...t, note: cleaned };
    }),
  };
}

/** Weight a position would have after a purchase, in percent of the total value. */
export function weightAfterBuy(valuation: PortfolioValuation, order: BuyOrder): number {
  const existing = valuation.positions.find(
    (p) => p.position.instrument.id === order.instrument.id,
  );
  const existingValue = existing ? valueCents(existing.position.units, order.price) : 0;
  const otherValue = valuation.positionsValueCents - (existing?.valueCents ?? 0);
  const newPositionValue = existingValue + order.amountCents;
  const total = order.cashAfterCents + otherValue + newPositionValue;
  return percentOf(newPositionValue, total);
}
