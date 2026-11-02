import { formatPercent } from "@/lib/format";
import type { AssetType, Quote } from "@/lib/market-data/types";
import type { PortfolioValuation, PositionValuation } from "./engine";
import type { PortfolioRecord, SnapshotRecord } from "./types";

/**
 * Deterministic analysis of the practice portfolio: allocation, insights,
 * history and the weekly summary. Everything is derived from stored
 * transactions, snapshots and retrieved prices – nothing is estimated,
 * back-filled or generated.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  etf: "Aktien-ETF",
  "bond-etf": "Anleihen-ETF",
  stock: "Einzelaktie",
};

const ASSET_GROUP_LABELS: Record<AssetType | "cash", string> = {
  etf: "Aktien-ETFs",
  "bond-etf": "Anleihen-ETFs",
  stock: "Einzelaktien",
  cash: "Verfügbares Guthaben",
};

export interface AllocationSlice {
  key: string;
  label: string;
  valueCents: number;
  percent: number;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function share(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** Split of the total value (cash included) by asset type. */
export function allocationByType(valuation: PortfolioValuation): AllocationSlice[] {
  const totals = new Map<AssetType | "cash", number>();
  for (const p of valuation.positions) {
    const type = p.position.instrument.type;
    totals.set(type, (totals.get(type) ?? 0) + p.valueCents);
  }
  totals.set("cash", valuation.cashCents);
  return [...totals.entries()]
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      label: ASSET_GROUP_LABELS[key],
      valueCents: value,
      percent: share(value, valuation.totalValueCents),
    }))
    .sort((a, b) => b.valueCents - a.valueCents);
}

/**
 * Split of the single stocks by sector. Returns null when no stock has
 * sector information, so no meaningless chart is shown.
 */
export function allocationBySector(valuation: PortfolioValuation): AllocationSlice[] | null {
  const stocks = valuation.positions.filter((p) => p.position.instrument.type === "stock");
  if (!stocks.some((p) => p.position.instrument.sector)) return null;
  const stockTotal = stocks.reduce((sum, p) => sum + p.valueCents, 0);
  const totals = new Map<string, number>();
  for (const p of stocks) {
    const sector = p.position.instrument.sector ?? "Ohne Angabe";
    totals.set(sector, (totals.get(sector) ?? 0) + p.valueCents);
  }
  return [...totals.entries()]
    .map(([key, value]) => ({
      key,
      label: key,
      valueCents: value,
      percent: share(value, stockTotal),
    }))
    .sort((a, b) => b.valueCents - a.valueCents);
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

export type InsightTone = "info" | "warning" | "neutral";

export interface Insight {
  id: string;
  tone: InsightTone;
  text: string;
}

function pct(value: number): string {
  return formatPercent(Math.round(value));
}

/** Ordered list of observations; the first one is the most relevant. */
/** Minimum change since the start (in percent) for the "im Plus/Minus" insights. */
export const NOTABLE_CHANGE_PERCENT = 0.5;

export function getInsights(valuation: PortfolioValuation): Insight[] {
  const insights: Insight[] = [];
  const positions = valuation.positions;

  if (positions.length === 0) {
    return [
      {
        id: "cash-only",
        tone: "neutral",
        text: "Noch ist dein ganzes Depot virtuelles Guthaben. Vergleiche zum Beispiel einen breit gestreuten ETF mit einer Einzelaktie.",
      },
    ];
  }

  if (!valuation.complete) {
    insights.push({
      id: "incomplete",
      tone: "warning",
      text: `Für ${valuation.missingQuoteCount === 1 ? "eine Position" : `${valuation.missingQuoteCount} Positionen`} fehlt ein aktueller Kurs. Der Depotwert nutzt dafür den letzten Kaufs- oder Verkaufskurs und ist deshalb ungenau.`,
    });
  }

  const stocks = positions.filter((p) => p.position.instrument.type === "stock");
  const largestStock = stocks[0];
  if (largestStock && largestStock.weightPercent >= 25) {
    insights.push({
      id: "single-stock-concentration",
      tone: "warning",
      text: `Eine einzelne Aktie (${largestStock.position.instrument.name}) macht ${pct(largestStock.weightPercent)} deines Depots aus. Entwickelt sich dieses eine Unternehmen schlecht, trifft das dein ganzes Depot.`,
    });
  }

  const sectors = allocationBySector(valuation);
  const topSector = sectors?.[0];
  const stocksInTopSector = topSector
    ? stocks.filter((p) => (p.position.instrument.sector ?? "Ohne Angabe") === topSector.key).length
    : 0;
  if (
    topSector &&
    topSector.key !== "Ohne Angabe" &&
    stocksInTopSector >= 2 &&
    topSector.percent >= 50
  ) {
    insights.push({
      id: "sector-concentration",
      tone: "warning",
      text: `Dein Depot ist derzeit stark auf eine Branche konzentriert: ${topSector.label} macht ${pct(topSector.percent)} deiner Einzelaktien aus. Unternehmen derselben Branche schwanken oft gemeinsam.`,
    });
  }

  if (positions.length >= 4 && stocks.length === positions.length) {
    insights.push({
      id: "many-stocks",
      tone: "info",
      text: `Mehr Positionen bedeuten nicht automatisch gute Diversifikation. Alle ${positions.length} Positionen sind Einzelaktien – ein breiter ETF enthält oft Hunderte Unternehmen.`,
    });
  }

  // Changes below half a percent are mostly rounding and daily noise.
  const notable =
    valuation.performancePercent !== null &&
    Math.abs(valuation.performancePercent) >= NOTABLE_CHANGE_PERCENT;
  if (valuation.totalGainCents < 0 && valuation.performancePercent !== null && notable) {
    insights.push({
      id: "value-down",
      tone: "info",
      text: `Der Wert deines Depots ist seit dem Start gefallen (${formatPercent(roundOneDecimal(valuation.performancePercent))}). Kurzfristige Schwankungen sind normal – wichtig ist, dass du das Risiko deiner Positionen verstehst.`,
    });
  }

  const largest = positions[0] as PositionValuation;
  if (largest.position.instrument.type !== "stock" && largest.weightPercent >= 50) {
    const holdings = largest.position.instrument.holdingsCount;
    insights.push({
      id: "large-fund",
      tone: "neutral",
      text: `${largest.position.instrument.name} macht ${pct(largest.weightPercent)} deines Depots aus. Das ist viel für eine Position – ein ETF verteilt das Geld aber selbst auf ${holdings ? `rund ${holdings.toLocaleString("de-DE")}` : "viele"} Wertpapiere.`,
    });
  }

  if (valuation.cashWeightPercent >= 80) {
    insights.push({
      id: "mostly-cash",
      tone: "neutral",
      text: `Rund ${pct(valuation.cashWeightPercent)} sind noch virtuelles Guthaben. Guthaben schwankt nicht, wächst ohne Zinsen aber auch nicht.`,
    });
  }

  if (valuation.totalGainCents > 0 && notable) {
    insights.push({
      id: "value-up",
      tone: "neutral",
      text: "Dein Depot liegt im Plus. Ein Gewinn zeigt nicht automatisch, dass eine Entscheidung gut war – Kurse können auch wieder fallen.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "spread",
      tone: "neutral",
      text:
        positions.length === 1
          ? "Dein Depot besteht aus einer Position und Guthaben. Überlege, was passiert, wenn genau diese Position stark fällt."
          : `Dein Depot verteilt sich auf ${positions.length} Positionen. Frag dich, wie stark sie voneinander abhängen.`,
    });
  }
  return insights;
}

/* ------------------------------------------------------------------ */
/* Portfolio history                                                   */
/* ------------------------------------------------------------------ */

export type HistoryPeriod = "7T" | "30T" | "alle";

export const HISTORY_PERIOD_LABELS: Record<HistoryPeriod, string> = {
  "7T": "7 Tage",
  "30T": "30 Tage",
  alle: "Seit Start",
};

const PERIOD_DAYS: Record<Exclude<HistoryPeriod, "alle">, number> = { "7T": 7, "30T": 30 };

function localDayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export interface HistoryPoint {
  at: string;
  totalValueCents: number;
  complete: boolean;
}

/** Points with at least two different calendar days are needed for a chart. */
export function hasEnoughHistory(points: readonly HistoryPoint[]): boolean {
  return new Set(points.map((p) => localDayKey(p.at))).size >= 2;
}

/**
 * Periods that are actually covered by recorded snapshots. A 7-day view is
 * only offered once the history is at least 7 days old, and so on.
 */
export function availablePeriods(snapshots: readonly SnapshotRecord[], now: Date): HistoryPeriod[] {
  const first = snapshots[0];
  if (!first) return [];
  const age = now.getTime() - Date.parse(first.at);
  const periods: HistoryPeriod[] = [];
  if (age >= PERIOD_DAYS["7T"] * DAY_MS) periods.push("7T");
  if (age >= PERIOD_DAYS["30T"] * DAY_MS) periods.push("30T");
  periods.push("alle");
  return periods;
}

export function historyPoints(
  snapshots: readonly SnapshotRecord[],
  period: HistoryPeriod,
  now: Date,
): HistoryPoint[] {
  const from = period === "alle" ? -Infinity : now.getTime() - PERIOD_DAYS[period] * DAY_MS;
  return snapshots
    .filter((s) => Date.parse(s.at) >= from)
    .map((s) => ({ at: s.at, totalValueCents: s.totalValueCents, complete: s.complete }));
}

/* ------------------------------------------------------------------ */
/* Weekly report                                                       */
/* ------------------------------------------------------------------ */

export interface PositionMove {
  name: string;
  symbol: string;
  changePercent: number;
}

export interface WeeklyReport {
  from: string;
  to: string;
  startValueCents: number;
  endValueCents: number;
  changeCents: number;
  changePercent: number | null;
  transactionCount: number;
  strongest: PositionMove | null;
  weakest: PositionMove | null;
  largest: { name: string; weightPercent: number } | null;
  notes: string[];
}

/**
 * Weekly summary, only if a snapshot from at least seven days ago exists.
 * It describes numbers only and never explains causes.
 */
export function getWeeklyReport(
  portfolio: PortfolioRecord,
  valuation: PortfolioValuation,
  now: Date,
  dataIsDemo: boolean,
): WeeklyReport | null {
  const cutoff = now.getTime() - 7 * DAY_MS;
  const base = [...portfolio.snapshots].reverse().find((s) => Date.parse(s.at) <= cutoff);
  if (!base) return null;

  const moves: PositionMove[] = [];
  let withoutComparison = 0;
  for (const p of valuation.positions) {
    const before = base.prices[p.position.instrument.id];
    if (before === undefined || before <= 0 || p.priceSource !== "quote") {
      withoutComparison += 1;
      continue;
    }
    moves.push({
      name: p.position.instrument.name,
      symbol: p.position.instrument.symbol,
      changePercent: ((p.price - before) / before) * 100,
    });
  }
  moves.sort((a, b) => b.changePercent - a.changePercent);

  const notes: string[] = [];
  if (dataIsDemo) notes.push("Alle Werte beruhen auf Beispieldaten, nicht auf echten Kursen.");
  if (withoutComparison > 0) {
    notes.push(
      `Für ${withoutComparison === 1 ? "eine Position" : `${withoutComparison} Positionen`} fehlt ein Vergleichskurs von vor sieben Tagen – sie fehlen in der Rangliste.`,
    );
  }
  if (!valuation.complete || !base.complete) {
    notes.push("Nicht alle Werte beruhen auf aktuellen Kursen. Der Vergleich ist deshalb ungenau.");
  }
  const concentration = getInsights(valuation).find(
    (i) => i.id === "single-stock-concentration" || i.id === "sector-concentration",
  );
  if (concentration) notes.push(concentration.text);

  const largest = valuation.positions[0];
  const changeCents = valuation.totalValueCents - base.totalValueCents;
  return {
    from: base.at,
    to: now.toISOString(),
    startValueCents: base.totalValueCents,
    endValueCents: valuation.totalValueCents,
    changeCents,
    changePercent: base.totalValueCents > 0 ? (changeCents / base.totalValueCents) * 100 : null,
    transactionCount: portfolio.transactions.filter((t) => Date.parse(t.at) > Date.parse(base.at))
      .length,
    strongest: moves[0] ?? null,
    weakest: moves.length > 1 ? (moves.at(-1) ?? null) : null,
    largest: largest
      ? { name: largest.position.instrument.name, weightPercent: largest.weightPercent }
      : null,
    notes,
  };
}

/**
 * Time of the oldest price behind the current valuation: the portfolio is only
 * as up to date as its oldest quote. Null when a held position has no quote.
 */
export function pricesUpdatedAt(
  portfolio: PortfolioRecord,
  quotes: Readonly<Record<string, Quote>>,
): string | null {
  let oldest: string | null = null;
  for (const position of portfolio.positions) {
    const quote = quotes[position.instrument.id];
    if (!quote) return null;
    if (oldest === null || quote.fetchedAt < oldest) oldest = quote.fetchedAt;
  }
  return oldest;
}
