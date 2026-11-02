import { formatEuro, formatNumber, formatPercent } from "@/lib/format";

/**
 * Compound-interest model used by the calculator and the lessons.
 *
 * Assumptions (shown to users in the UI as well):
 * - Monthly contributions are paid at the start of each month.
 * - The annual return is converted into an equivalent constant monthly rate,
 *   so that one year of growth equals exactly the stated annual return
 *   (100 € at 5 % become 105 € after one year).
 * - Taxes, fees, inflation and market volatility are not included.
 */

export interface CompoundInput {
  initialAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
}

export type CompoundField = keyof CompoundInput;

export interface FieldLimits {
  min: number;
  max: number;
  step: number;
  integer?: boolean;
  /** Upper bound of the slider; typing allows values up to `max`. */
  sliderMax: number;
}

export const COMPOUND_LIMITS: Record<CompoundField, FieldLimits> = {
  initialAmount: { min: 0, max: 1_000_000, step: 100, sliderMax: 20_000 },
  monthlyContribution: { min: 0, max: 10_000, step: 5, sliderMax: 500 },
  annualReturnPercent: { min: 0, max: 15, step: 0.5, sliderMax: 12 },
  years: { min: 0, max: 60, step: 1, integer: true, sliderMax: 50 },
};

export const DEFAULT_COMPOUND_INPUT: CompoundInput = {
  initialAmount: 0,
  monthlyContribution: 50,
  annualReturnPercent: 5,
  years: 30,
};

/** Returns above this value get an extra "very optimistic" hint. */
export const OPTIMISTIC_RETURN_PERCENT = 8;

export interface YearPoint {
  year: number;
  contributions: number;
  value: number;
  growth: number;
}

export interface CompoundResult {
  input: CompoundInput;
  /** One entry per year, starting with year 0 (the initial amount). */
  points: YearPoint[];
  totalContributions: number;
  finalValue: number;
  growth: number;
}

function formatLimit(field: CompoundField, value: number): string {
  if (field === "annualReturnPercent") return formatPercent(value);
  if (field === "years") return `${formatNumber(value)} Jahre`;
  return formatEuro(value);
}

/** Returns a German validation message, or null when the value is valid. */
export function validateCompoundField(field: CompoundField, value: number): string | null {
  const limits = COMPOUND_LIMITS[field];
  if (!Number.isFinite(value)) return "Bitte gib eine Zahl ein.";
  if (value < 0) return "Negative Werte sind hier nicht möglich.";
  if (value < limits.min) return `Mindestens ${formatLimit(field, limits.min)}.`;
  if (value > limits.max) return `Höchstens ${formatLimit(field, limits.max)}.`;
  if (limits.integer && !Number.isInteger(value)) return "Bitte gib eine ganze Zahl ein.";
  return null;
}

function clampField(field: CompoundField, value: unknown): number {
  const limits = COMPOUND_LIMITS[field];
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : limits.min;
  const clamped = Math.min(limits.max, Math.max(limits.min, numeric));
  return limits.integer ? Math.round(clamped) : clamped;
}

/** Clamps every field into its allowed range. Invalid numbers fall back to the minimum. */
export function sanitizeCompoundInput(
  input: Partial<Record<CompoundField, unknown>>,
): CompoundInput {
  return {
    initialAmount: clampField("initialAmount", input.initialAmount),
    monthlyContribution: clampField("monthlyContribution", input.monthlyContribution),
    annualReturnPercent: clampField("annualReturnPercent", input.annualReturnPercent),
    years: clampField("years", input.years),
  };
}

/** Constant monthly rate that compounds to the given annual return. */
export function monthlyRateFromAnnual(annualReturnPercent: number): number {
  return Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;
}

export function calculateCompoundGrowth(rawInput: CompoundInput): CompoundResult {
  const input = sanitizeCompoundInput(rawInput);
  const rate = monthlyRateFromAnnual(input.annualReturnPercent);

  let value = input.initialAmount;
  let contributions = input.initialAmount;
  const points: YearPoint[] = [{ year: 0, contributions, value, growth: 0 }];

  for (let year = 1; year <= input.years; year++) {
    for (let month = 0; month < 12; month++) {
      value = (value + input.monthlyContribution) * (1 + rate);
      contributions += input.monthlyContribution;
    }
    points.push({ year, contributions, value, growth: value - contributions });
  }

  return {
    input,
    points,
    totalContributions: contributions,
    finalValue: value,
    growth: value - contributions,
  };
}

/** Value of a one-off amount with interest paid out each year (no compounding). */
export function simpleInterestValue(principal: number, annualRatePercent: number, years: number) {
  return principal * (1 + (annualRatePercent / 100) * years);
}

/** Value of a one-off amount with interest reinvested once per year. */
export function compoundValue(principal: number, annualRatePercent: number, years: number) {
  return principal * Math.pow(1 + annualRatePercent / 100, years);
}
