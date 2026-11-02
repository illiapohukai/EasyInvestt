import { readJsonDetailed, removeKey, writeJson } from "@/lib/progress/storage";
import type { Quote } from "@/lib/market-data/types";
import {
  appendSnapshot,
  applyBuy,
  applySell,
  createPortfolio,
  valuePortfolio,
  withTransactionNote,
  type BuyOrder,
  type SellOrder,
} from "./engine";
import { parseDepotState, type DepotIssue } from "./schema";
import {
  DEPOT_STORAGE_KEY,
  EMPTY_DEPOT,
  type DataMode,
  type DepotState,
  type PortfolioRecord,
  type TransactionRecord,
} from "./types";

/**
 * External store for the practice portfolio, persisted in localStorage under
 * its own key – fully independent of the learning progress.
 * Built for useSyncExternalStore; the prerender snapshot is always empty.
 */

export interface DepotSnapshot {
  state: DepotState;
  /** Problem found while loading stored data, shown once in the UI. */
  issue: DepotIssue;
}

type Listener = () => void;

const SERVER_SNAPSHOT: DepotSnapshot = Object.freeze({ state: EMPTY_DEPOT, issue: null });
const MAX_CACHED_QUOTES = 60;

let snapshot: DepotSnapshot | null = null;
let persisted = true;
const listeners = new Set<Listener>();

function load(): DepotSnapshot {
  const stored = readJsonDetailed(DEPOT_STORAGE_KEY);
  snapshot = stored.invalid
    ? { state: EMPTY_DEPOT, issue: "malformed" }
    : parseDepotState(stored.value);
  return snapshot;
}

function current(): DepotSnapshot {
  return snapshot ?? load();
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(state: DepotState, issue: DepotIssue = current().issue) {
  // Never overwrite data written by a newer app version.
  if (issue === "newer-version") throw new Error("Depot is read-only.");
  snapshot = { state, issue };
  persisted = writeJson(DEPOT_STORAGE_KEY, state);
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key === null || event.key === DEPOT_STORAGE_KEY) {
    load();
    emit();
  }
}

function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

function requirePortfolio(): PortfolioRecord {
  const portfolio = current().state.portfolio;
  if (!portfolio) throw new Error("No portfolio.");
  return portfolio;
}

/** Keeps quotes of held instruments plus the most recently fetched others. */
function pruneQuotes(quotes: Record<string, Quote>, portfolio: PortfolioRecord | null) {
  const held = new Set(portfolio?.positions.map((p) => p.instrument.id) ?? []);
  const others = Object.values(quotes)
    .filter((q) => !held.has(q.instrumentId))
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt))
    .slice(0, MAX_CACHED_QUOTES);
  const result: Record<string, Quote> = {};
  for (const quote of Object.values(quotes)) {
    if (held.has(quote.instrumentId)) result[quote.instrumentId] = quote;
  }
  for (const quote of others) result[quote.instrumentId] = quote;
  return result;
}

export const depotStore = {
  getSnapshot(): DepotSnapshot {
    return current();
  },

  getServerSnapshot(): DepotSnapshot {
    return SERVER_SNAPSHOT;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    if (listeners.size === 1 && typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  },

  /** False when the last write failed, e.g. because storage is blocked. */
  isPersisted(): boolean {
    return persisted;
  },

  isReadOnly(): boolean {
    return current().issue === "newer-version";
  },

  createPortfolio(input: {
    name: string;
    startingCashCents: number;
    providerId: string;
    dataMode: DataMode;
    now?: Date;
  }): PortfolioRecord {
    const portfolio = createPortfolio({
      ...input,
      id: newId("depot"),
      now: input.now ?? new Date(),
    });
    commit({ ...current().state, portfolio }, null);
    return portfolio;
  },

  buy(order: BuyOrder, now: Date = new Date()): TransactionRecord {
    const { state } = current();
    const result = applyBuy(requirePortfolio(), order, now, newId("tx"));
    const quotes = { ...state.quotes, [order.quote.instrumentId]: order.quote };
    const portfolio = appendSnapshot(
      result.portfolio,
      valuePortfolio(result.portfolio, quotes),
      "buy",
      now,
    );
    commit({ ...state, portfolio, quotes: pruneQuotes(quotes, portfolio) });
    return result.transaction;
  },

  sell(order: SellOrder, now: Date = new Date()): TransactionRecord {
    const { state } = current();
    const result = applySell(requirePortfolio(), order, now, newId("tx"));
    const quotes = { ...state.quotes, [order.quote.instrumentId]: order.quote };
    const portfolio = appendSnapshot(
      result.portfolio,
      valuePortfolio(result.portfolio, quotes),
      "sell",
      now,
    );
    commit({ ...state, portfolio, quotes: pruneQuotes(quotes, portfolio) });
    return result.transaction;
  },

  /**
   * Stores freshly retrieved quotes. When quotes of held positions changed,
   * a "refresh" snapshot records the portfolio value with these prices.
   */
  applyQuotes(fresh: readonly Quote[], now: Date = new Date()) {
    if (fresh.length === 0 || depotStore.isReadOnly()) return;
    const { state } = current();
    const quotes = { ...state.quotes };
    for (const quote of fresh) quotes[quote.instrumentId] = quote;
    let portfolio = state.portfolio;
    const held = new Set(portfolio?.positions.map((p) => p.instrument.id) ?? []);
    const touchesPositions = fresh.some((q) => held.has(q.instrumentId));
    if (portfolio && touchesPositions) {
      portfolio = appendSnapshot(portfolio, valuePortfolio(portfolio, quotes), "refresh", now);
    }
    commit({
      ...state,
      portfolio,
      quotes: pruneQuotes(quotes, portfolio),
      lastRefreshAt: touchesPositions ? now.toISOString() : state.lastRefreshAt,
    });
  },

  saveNote(transactionId: string, note: string) {
    const { state } = current();
    commit({ ...state, portfolio: withTransactionNote(requirePortfolio(), transactionId, note) });
  },

  dismissIssue() {
    const { state, issue } = current();
    if (issue === null || issue === "newer-version") return;
    snapshot = { state, issue: null };
    emit();
  },

  /** Deletes the practice portfolio. Learning progress is not touched. */
  reset() {
    snapshot = { state: EMPTY_DEPOT, issue: null };
    persisted = removeKey(DEPOT_STORAGE_KEY);
    emit();
  },
};

/** Test helper: forget cached state so the next read comes from storage. */
export function __resetDepotStoreForTests() {
  snapshot = null;
  persisted = true;
  listeners.clear();
  if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
}
