import { DEMO_INSTRUMENTS, findDemoInstrument, type DemoInstrument } from "./demo/instruments";
import { demoPrice, demoTradingDayDate, demoTradingDayIndex } from "./demo/prices";
import { MarketDataError } from "./errors";
import type {
  ExchangeRate,
  HistoryRange,
  Instrument,
  InstrumentDetails,
  MarketDataProvider,
  PriceHistory,
  ProviderInfo,
  Quote,
} from "./types";

export const DEMO_PROVIDER_INFO: ProviderInfo = {
  id: "demo",
  name: "Geldstart-Beispieldaten",
};

const RANGE_TRADING_DAYS: Record<HistoryRange, number> = { "1M": 21, "6M": 126, "1J": 252 };

export const ASSET_TYPE_SEARCH_TERMS: Record<Instrument["type"], string> = {
  etf: "etf fonds aktien-etf",
  "bond-etf": "etf anleihen anleihen-etf fonds",
  stock: "aktie einzelaktie",
};

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toInstrument(demo: DemoInstrument): InstrumentDetails {
  const { basePrice: _basePrice, drift: _drift, beta: _beta, idioVol: _idioVol, ...details } = demo;
  return details;
}

function requireInstrument(id: string): DemoInstrument {
  const instrument = findDemoInstrument(id);
  if (!instrument) {
    throw new MarketDataError("not-found", "Dieses Wertpapier gibt es in den Beispieldaten nicht.");
  }
  return instrument;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new MarketDataError("aborted", "Anfrage abgebrochen.");
}

/**
 * Market-data adapter that serves fictional sample data.
 * Every value it returns has the status "demo".
 */
export function createDemoProvider(clock: () => Date = () => new Date()): MarketDataProvider {
  return {
    info: DEMO_PROVIDER_INFO,
    mode: "demo",

    async searchInstruments(query, signal) {
      throwIfAborted(signal);
      const terms = normalise(query).split(/\s+/).filter(Boolean);
      return DEMO_INSTRUMENTS.filter((instrument) => {
        const haystack = normalise(
          [
            instrument.name,
            instrument.symbol,
            instrument.sector ?? "",
            instrument.region ?? "",
            ASSET_TYPE_SEARCH_TERMS[instrument.type],
          ].join(" "),
        );
        return terms.every((term) => haystack.includes(term));
      }).map(toInstrument);
    },

    async getQuote(instrumentId, signal) {
      throwIfAborted(signal);
      const instrument = requireInstrument(instrumentId);
      const now = clock();
      const index = demoTradingDayIndex(now);
      const price = demoPrice(instrument, index);
      const quote: Quote = {
        instrumentId,
        price,
        currency: instrument.currency,
        asOf: `${demoTradingDayDate(index)}T12:00:00.000Z`,
        asOfPrecision: "day",
        fetchedAt: now.toISOString(),
        status: "demo",
        providerId: DEMO_PROVIDER_INFO.id,
      };
      if (index > 0) {
        const previousClose = demoPrice(instrument, index - 1);
        quote.previousClose = previousClose;
        quote.change = Math.round((price - previousClose) * 100) / 100;
        quote.changePercent =
          previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;
      }
      return quote;
    },

    async getHistoricalPrices(instrumentId, range, signal): Promise<PriceHistory> {
      throwIfAborted(signal);
      const instrument = requireInstrument(instrumentId);
      const last = demoTradingDayIndex(clock());
      const first = Math.max(0, last - RANGE_TRADING_DAYS[range] + 1);
      const points = [];
      for (let index = first; index <= last; index += 1) {
        points.push({ date: demoTradingDayDate(index), close: demoPrice(instrument, index) });
      }
      return {
        instrumentId,
        currency: instrument.currency,
        range,
        status: "demo",
        points,
        providerId: DEMO_PROVIDER_INFO.id,
      };
    },

    async getInstrumentDetails(instrumentId, signal) {
      throwIfAborted(signal);
      return toInstrument(requireInstrument(instrumentId));
    },

    async getExchangeRate(from, to, signal): Promise<ExchangeRate> {
      throwIfAborted(signal);
      if (from === to) {
        return {
          from,
          to,
          rate: 1,
          asOf: clock().toISOString(),
          providerId: DEMO_PROVIDER_INFO.id,
        };
      }
      throw new MarketDataError(
        "unsupported",
        "Die Beispieldaten enthalten keine Wechselkurse. Alle Beispiel-Wertpapiere notieren in Euro.",
      );
    },
  };
}
