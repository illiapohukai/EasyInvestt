import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketData } from "@/config/market-data";
import { depotStore } from "@/lib/depot/store";
import { MarketDataError, toMarketDataError } from "@/lib/market-data/errors";
import { needsRefresh } from "@/lib/market-data/status";
import type {
  HistoryRange,
  Instrument,
  InstrumentDetails,
  PriceHistory,
  Quote,
} from "@/lib/market-data/types";

export type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: MarketDataError };

/** Runs a market-data request whenever `key` changes. `null` disables it. */
function useRequest<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
): RequestState<T> & { reload: () => void } {
  const [state, setState] = useState<RequestState<T>>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (key === null) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    loadRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        const failure = toMarketDataError(error);
        if (!controller.signal.aborted && failure.kind !== "aborted") {
          setState({ status: "error", error: failure });
        }
      });
    return () => controller.abort();
  }, [key, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}

/** Debounced instrument search. An empty query lists suggestions (demo) or nothing. */
export function useInstrumentSearch(query: string) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);
  const service = getMarketData();
  const enabled = debounced.length >= 2 || (debounced === "" && service.provider.mode === "demo");
  return useRequest<Instrument[]>(enabled ? `search:${debounced}` : null, (signal) =>
    service.search(debounced, signal),
  );
}

/** Quote for one instrument. Successful quotes are cached in the portfolio store. */
export function useQuote(instrumentId: string | null) {
  const [force, setForce] = useState(0);
  const request = useRequest<Quote>(
    instrumentId ? `quote:${instrumentId}:${force}` : null,
    async (signal) => {
      const quote = await getMarketData().quote(instrumentId as string, {
        force: force > 0,
        signal,
      });
      depotStore.applyQuotes([quote]);
      return quote;
    },
  );
  const refresh = useCallback(() => setForce((n) => n + 1), []);
  return { ...request, refresh };
}

export function useInstrumentDetails(instrumentId: string | null) {
  return useRequest<InstrumentDetails>(instrumentId ? `details:${instrumentId}` : null, (signal) =>
    getMarketData().details(instrumentId as string, signal),
  );
}

export function usePriceHistory(instrumentId: string | null, range: HistoryRange) {
  return useRequest<PriceHistory>(
    instrumentId ? `history:${instrumentId}:${range}` : null,
    (signal) => getMarketData().history(instrumentId as string, range, signal),
  );
}

export interface RefreshState {
  status: "idle" | "loading" | "done";
  /** Errors of the last refresh, by instrument id. */
  errors: Record<string, MarketDataError>;
  updated: number;
}

/**
 * Refreshes the quotes of all held positions – automatically once when they
 * are outdated, otherwise only when the user asks for it. No polling.
 */
export function useQuoteRefresh(
  instrumentIds: readonly string[],
  quotes: Record<string, Quote>,
  enabled: boolean,
) {
  const [state, setState] = useState<RefreshState>({ status: "idle", errors: {}, updated: 0 });
  const autoDone = useRef(false);
  const running = useRef(false);
  const idsKey = instrumentIds.join("|");

  const refresh = useCallback(
    async (force: boolean) => {
      const ids = idsKey === "" ? [] : idsKey.split("|");
      if (running.current || ids.length === 0) return;
      running.current = true;
      setState((s) => ({ ...s, status: "loading" }));
      const result = await getMarketData().quotes(ids, { force });
      depotStore.applyQuotes(result.quotes);
      running.current = false;
      setState({ status: "done", errors: result.errors, updated: result.quotes.length });
    },
    [idsKey],
  );

  useEffect(() => {
    if (!enabled || autoDone.current || idsKey === "") return;
    const now = new Date();
    const outdated = idsKey.split("|").some((id) => needsRefresh(quotes[id], now));
    autoDone.current = true;
    if (outdated) void refresh(false);
  }, [enabled, idsKey, quotes, refresh]);

  return { ...state, refresh: () => refresh(true) };
}
