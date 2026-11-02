const euroWhole = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euroCents = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plainNumber = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

/** Formats a euro amount, e.g. 12345.6 -> "12.346 €" (or "12.345,60 €" with cents). */
export function formatEuro(value: number, options: { cents?: boolean } = {}): string {
  const safe = Number.isFinite(value) ? value : 0;
  // Avoid "-0 €" for tiny negative rounding artefacts.
  const normalised = Math.abs(safe) < 0.005 ? 0 : safe;
  return (options.cents ? euroCents : euroWhole).format(normalised);
}

/** Formats a percentage value given in percent, e.g. 5.5 -> "5,5 %". */
export function formatPercent(value: number): string {
  return `${plainNumber.format(Number.isFinite(value) ? value : 0)}\u00a0%`;
}

/** Formats a plain number with German separators, e.g. 1500 -> "1.500". */
export function formatNumber(value: number): string {
  return plainNumber.format(Number.isFinite(value) ? value : 0);
}

export function formatYears(value: number): string {
  return value === 1 ? "1\u00a0Jahr" : `${formatNumber(value)}\u00a0Jahre`;
}

/** Dative form for phrases like "nach 10 Jahren" or "in 1 Jahr". */
export function formatYearsDative(value: number): string {
  return value === 1 ? "1\u00a0Jahr" : `${formatNumber(value)}\u00a0Jahren`;
}

/**
 * Parses user input written in German or international notation.
 * Accepts "1.000", "1.000,50", "1000,5", "1000.5", "12 €" or "5 %".
 * Returns null when the text is not a valid number.
 */
export function parseLocaleNumber(input: string): number | null {
  const cleaned = input.replace(/[\s\u00a0€%]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "+") return null;

  let normalised: string;
  if (cleaned.includes(",")) {
    // German notation: dots are thousands separators, comma is the decimal separator.
    if (!/^[+-]?(\d{1,3}(\.\d{3})+|\d+),\d*$/.test(cleaned) && !/^[+-]?\d*,\d+$/.test(cleaned)) {
      return null;
    }
    normalised = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // "1.000" or "1.000.000" -> thousands separators.
    normalised = cleaned.replace(/\./g, "");
  } else {
    normalised = cleaned;
  }

  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalised)) return null;
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ */
/* Practice portfolio                                                  */
/* ------------------------------------------------------------------ */

const euroSigned = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const percentSigned = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const shares = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 4 });

const priceFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function centsToEuro(cents: number): number {
  const euro = cents / 100;
  return Math.abs(euro) < 0.005 ? 0 : euro;
}

/** 123456 (cents) -> "1.234,56 €" */
export function formatCents(cents: number): string {
  return euroCents.format(centsToEuro(Number.isFinite(cents) ? cents : 0));
}

/** 1234 (cents) -> "+12,34 €", -1234 -> "-12,34 €", 0 -> "0,00 €" */
export function formatSignedCents(cents: number): string {
  return euroSigned.format(centsToEuro(Number.isFinite(cents) ? cents : 0));
}

/** 1.234 -> "+1,23 %" */
export function formatSignedPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.abs(safe) < 0.005 ? 0 : safe;
  return `${percentSigned.format(rounded)}\u00a0%`;
}

/** Price per share with 2–4 decimals, e.g. "87,43 €" or "0,1234 €". */
export function formatPrice(value: number, currency = "EUR"): string {
  if (currency !== "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }
  return priceFormat.format(Number.isFinite(value) ? value : 0);
}

/** 11437 units of 1/10,000 share -> "1,1437" */
export function formatShares(units: number): string {
  return shares.format(units / 10_000);
}

/** "2026-11-02T…" -> "02.11.2026" (local date) */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? dateFormat.format(date) : "–";
}

/** "2026-11-02T13:05:00Z" -> "02.11.2026, 14:05 Uhr" (local time) */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? `${dateTimeFormat.format(date)}\u00a0Uhr` : "–";
}

/** Formats a price timestamp. Day-precision values are shown as plain dates. */
export function formatPriceTime(iso: string, precision: "day" | "minute"): string {
  if (precision === "day") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (match) return `${match[3]}.${match[2]}.${match[1]}`;
  }
  return formatDateTime(iso);
}
