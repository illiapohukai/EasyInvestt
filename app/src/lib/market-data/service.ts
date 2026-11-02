import { MarketDataError, toMarketDataError } from "./errors";
import type {
  HistoryRange,
  Instrument,
  InstrumentDetails,
  MarketDataProvider,
  PriceHistory,
  Quote,
} from "./types";

/**
 * Caching layer between the UI and a MarketDataProvider.
 *
 * - Responses are cached in memory, so re-rendering never triggers requests.
 * - Identical requests that run at the same time share one network call.
 * - After a rate-limit response, no further requests are sent until the
 *   provider's waiting time is over (default 60 seconds).
 * - Without a network connection, requests to a real provider fail fast with
 *   an "offline" error. The demo adapter works offline.
 * - There is no polling. Quotes are only refreshed on explicit actions.
 */

const TTL_MS = {
  search: 10 * 60 * 1000,
  quote: 60 * 1000,
  history: 60 * 60 * 1000,
  details: 24 * 60 * 60 * 1000,
};
const DEFAULT_RATE_LIMIT_PAUSE_S = 60;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface QuoteBatchResult {
  quotes: Quote[];
  errors: Record<string, MarketDataError>;
}

export interface MarketDataService {
  readonly provider: MarketDataProvider;
  search(query: string, signal?: AbortSignal): Promise<Instrument[]>;
  quote(instrumentId: string, options?: { force?: boolean; signal?: AbortSignal }): Promise<Quote>;
  quotes(instrumentIds: string[], options?: { force?: boolean }): Promise<QuoteBatchResult>;
  history(instrumentId: string, range: HistoryRange, signal?: AbortSignal): Promise<PriceHistory>;
  details(instrumentId: string, signal?: AbortSignal): Promise<InstrumentDetails>;
  /** Milliseconds until requests are allowed again after a rate limit, otherwise 0. */
  rateLimitRemainingMs(): number;
  clearCache(): void;
}

export function createMarketDataService(
  provider: MarketDataProvider,
  clock: () => number = () => Date.now(),
): MarketDataService {
  const cache = new Map<string, CacheEntry<unknown>>();
  const inFlight = new Map<string, Promise<unknown>>();
  let blockedUntil = 0;

  function guard() {
    const now = clock();
    if (now < blockedUntil) {
      throw new MarketDataError(
        "rate-limit",
        "Pause wegen zu vieler Anfragen.",
        Math.ceil((blockedUntil - now) / 1000),
      );
    }
    if (
      provider.mode === "market" &&
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      throw new MarketDataError("offline", "Keine Internetverbindung.");
    }
  }

  async function cached<T>(
    key: string,
    ttl: number,
    load: () => Promise<T>,
    force = false,
  ): Promise<T> {
    const hit = cache.get(key);
    if (!force && hit && hit.expiresAt > clock()) return hit.value as T;
    const running = inFlight.get(key);
    if (running) return running as Promise<T>;

    guard();
    const promise = load()
      .then((value) => {
        cache.set(key, { value, expiresAt: clock() + ttl });
        return value;
      })
      .catch((error: unknown) => {
        const failure = toMarketDataError(error);
        if (failure.kind === "rate-limit") {
          blockedUntil = clock() + (failure.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_PAUSE_S) * 1000;
        }
        throw failure;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  const service: MarketDataService = {
    provider,

    search(query, signal) {
      const normalised = query.trim().toLowerCase();
      return cached(`search:${normalised}`, TTL_MS.search, () =>
        provider.searchInstruments(normalised, signal),
      );
    },

    quote(instrumentId, options = {}) {
      return cached(
        `quote:${instrumentId}`,
        TTL_MS.quote,
        () => provider.getQuote(instrumentId, options.signal),
        options.force ?? false,
      );
    },

    async quotes(instrumentIds, options = {}) {
      const result: QuoteBatchResult = { quotes: [], errors: {} };
      // Sequential on purpose: keeps request bursts small for rate-limited plans.
      for (const id of instrumentIds) {
        try {
          result.quotes.push(await service.quote(id, { force: options.force ?? false }));
        } catch (error) {
          const failure = toMarketDataError(error);
          result.errors[id] = failure;
          if (failure.kind === "rate-limit" || failure.kind === "offline") {
            // Remaining requests would fail the same way.
            for (const rest of instrumentIds.slice(instrumentIds.indexOf(id) + 1)) {
              result.errors[rest] = failure;
            }
            break;
          }
        }
      }
      return result;
    },

    history(instrumentId, range, signal) {
      return cached(`history:${instrumentId}:${range}`, TTL_MS.history, () =>
        provider.getHistoricalPrices(instrumentId, range, signal),
      );
    },

    details(instrumentId, signal) {
      return cached(`details:${instrumentId}`, TTL_MS.details, () =>
        provider.getInstrumentDetails(instrumentId, signal),
      );
    },

    rateLimitRemainingMs() {
      return Math.max(0, blockedUntil - clock());
    },

    clearCache() {
      cache.clear();
    },
  };
  return service;
}
