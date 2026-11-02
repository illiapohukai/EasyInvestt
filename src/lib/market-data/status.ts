import type { DisplayQuoteStatus, Quote } from "./types";

/** Quotes from a real provider count as "zwischengespeichert" after 15 minutes. */
export const MARKET_QUOTE_FRESH_MS = 15 * 60 * 1000;
/** …and as "veraltet" after 24 hours. */
export const MARKET_QUOTE_STALE_MS = 24 * 60 * 60 * 1000;

export const STATUS_LABELS: Record<DisplayQuoteStatus, string> = {
  realtime: "Echtzeit",
  delayed: "Verzögert",
  eod: "Schlusskurs",
  demo: "Beispieldaten",
  cached: "Zwischengespeichert",
  stale: "Veraltet",
  unavailable: "Nicht verfügbar",
};

export const STATUS_DESCRIPTIONS: Record<DisplayQuoteStatus, string> = {
  realtime: "Der Datenanbieter liefert diesen Kurs als Echtzeitkurs.",
  delayed: "Kurs während der Handelszeit – er kann einige Minuten verzögert sein.",
  eod: "Letzter verfügbarer Schlusskurs. Gerade wird nicht gehandelt oder es gibt nur Tageskurse.",
  demo: "Beispieldaten – keine aktuellen Marktdaten.",
  cached: "Zuletzt geladener Kurs aus dem Zwischenspeicher. Er ist nicht mehr ganz aktuell.",
  stale: "Dieser Kurs ist älter als 24 Stunden. Aktualisiere die Kurse.",
  unavailable: "Für dieses Wertpapier liegt gerade kein Kurs vor.",
};

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ageMs(quote: Quote, now: Date): number {
  const fetched = Date.parse(quote.fetchedAt);
  return Number.isFinite(fetched) ? now.getTime() - fetched : Number.POSITIVE_INFINITY;
}

/** Status to show for a (possibly cached) quote. */
export function getDisplayStatus(quote: Quote | undefined, now: Date): DisplayQuoteStatus {
  if (!quote) return "unavailable";
  // Demo values are never market prices, whatever their age.
  if (quote.status === "demo") return "demo";
  const age = ageMs(quote, now);
  if (age > MARKET_QUOTE_STALE_MS) return "stale";
  if (age > MARKET_QUOTE_FRESH_MS) return "cached";
  return quote.status;
}

/** True when a quote should be requested again from the provider. */
export function needsRefresh(quote: Quote | undefined, now: Date): boolean {
  if (!quote) return true;
  if (quote.status === "demo") return !isSameLocalDay(new Date(quote.fetchedAt), now);
  return ageMs(quote, now) > MARKET_QUOTE_FRESH_MS;
}

/**
 * Virtual orders use the previewed price. That price must be recent enough:
 * demo prices from today, market prices not older than 15 minutes.
 */
export function isQuoteUsableForOrder(quote: Quote | undefined, now: Date): boolean {
  if (!quote || !(quote.price > 0)) return false;
  return !needsRefresh(quote, now);
}
