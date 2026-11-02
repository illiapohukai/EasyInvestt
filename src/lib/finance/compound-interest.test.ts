import { describe, expect, it } from "vitest";
import {
  calculateCompoundGrowth,
  COMPOUND_LIMITS,
  compoundValue,
  DEFAULT_COMPOUND_INPUT,
  monthlyRateFromAnnual,
  sanitizeCompoundInput,
  simpleInterestValue,
  validateCompoundField,
} from "./compound-interest";
import { MAX_CHART_BARS, pickChartPoints } from "./chart-points";

const base = { initialAmount: 0, monthlyContribution: 0, annualReturnPercent: 0, years: 0 };

describe("calculateCompoundGrowth", () => {
  it("grows a one-off amount by exactly the annual return per year", () => {
    const result = calculateCompoundGrowth({
      ...base,
      initialAmount: 100,
      annualReturnPercent: 5,
      years: 1,
    });
    expect(result.finalValue).toBeCloseTo(105, 8);
    const twoYears = calculateCompoundGrowth({
      ...base,
      initialAmount: 100,
      annualReturnPercent: 5,
      years: 2,
    });
    expect(twoYears.finalValue).toBeCloseTo(110.25, 8);
    expect(twoYears.growth).toBeCloseTo(10.25, 8);
  });

  it("returns exactly the contributions at 0 % return", () => {
    const result = calculateCompoundGrowth({
      initialAmount: 1000,
      monthlyContribution: 50,
      annualReturnPercent: 0,
      years: 10,
    });
    expect(result.totalContributions).toBe(1000 + 50 * 12 * 10);
    expect(result.finalValue).toBeCloseTo(7000, 8);
    expect(result.growth).toBeCloseTo(0, 8);
  });

  it("handles all-zero input without NaN", () => {
    const result = calculateCompoundGrowth(base);
    expect(result.finalValue).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.growth).toBe(0);
    expect(result.points).toEqual([{ year: 0, contributions: 0, value: 0, growth: 0 }]);
  });

  it("keeps the initial amount when the duration is 0 years", () => {
    const result = calculateCompoundGrowth({
      ...base,
      initialAmount: 500,
      monthlyContribution: 50,
      annualReturnPercent: 7,
    });
    expect(result.finalValue).toBe(500);
    expect(result.points).toHaveLength(1);
  });

  it("pays monthly contributions at the start of each month", () => {
    const result = calculateCompoundGrowth({
      ...base,
      monthlyContribution: 100,
      annualReturnPercent: 6,
      years: 1,
    });
    const rate = monthlyRateFromAnnual(6);
    let expected = 0;
    for (let month = 0; month < 12; month++) expected = (expected + 100) * (1 + rate);
    expect(result.finalValue).toBeCloseTo(expected, 8);
    // Start-of-month payments earn more than the paid-in 1,200 € but less than 1,200 € * 1.06.
    expect(result.finalValue).toBeGreaterThan(1200);
    expect(result.finalValue).toBeLessThan(1272);
  });

  it("returns one point per year including year 0", () => {
    const result = calculateCompoundGrowth(DEFAULT_COMPOUND_INPUT);
    expect(result.points).toHaveLength(DEFAULT_COMPOUND_INPUT.years + 1);
    expect(result.points.at(-1)?.value).toBeCloseTo(result.finalValue, 8);
    for (let index = 1; index < result.points.length; index++) {
      expect(result.points[index]!.value).toBeGreaterThan(result.points[index - 1]!.value);
    }
  });

  it("stays finite at the upper limits", () => {
    const result = calculateCompoundGrowth({
      initialAmount: COMPOUND_LIMITS.initialAmount.max,
      monthlyContribution: COMPOUND_LIMITS.monthlyContribution.max,
      annualReturnPercent: COMPOUND_LIMITS.annualReturnPercent.max,
      years: COMPOUND_LIMITS.years.max,
    });
    expect(Number.isFinite(result.finalValue)).toBe(true);
    expect(result.finalValue).toBeGreaterThan(result.totalContributions);
  });

  it("sanitizes invalid input instead of producing NaN", () => {
    const result = calculateCompoundGrowth({
      initialAmount: Number.NaN,
      monthlyContribution: -50,
      annualReturnPercent: 99,
      years: 2.6,
    });
    expect(result.input).toEqual({
      initialAmount: 0,
      monthlyContribution: 0,
      annualReturnPercent: 15,
      years: 3,
    });
    expect(Number.isNaN(result.finalValue)).toBe(false);
  });
});

describe("sanitizeCompoundInput", () => {
  it("clamps values into their limits and rounds years", () => {
    expect(
      sanitizeCompoundInput({
        initialAmount: 5_000_000,
        monthlyContribution: "50",
        annualReturnPercent: -1,
        years: 10.4,
      }),
    ).toEqual({
      initialAmount: 1_000_000,
      monthlyContribution: 0,
      annualReturnPercent: 0,
      years: 10,
    });
  });
});

describe("validateCompoundField", () => {
  it("accepts valid values", () => {
    expect(validateCompoundField("initialAmount", 0)).toBeNull();
    expect(validateCompoundField("annualReturnPercent", 7.5)).toBeNull();
    expect(validateCompoundField("years", 60)).toBeNull();
  });

  it("rejects negative, too large, non-finite and fractional year values", () => {
    expect(validateCompoundField("monthlyContribution", -1)).toMatch(/Negative/);
    expect(validateCompoundField("annualReturnPercent", 16)).toMatch(/Höchstens 15\s%/);
    expect(validateCompoundField("initialAmount", Number.NaN)).toMatch(/Zahl/);
    expect(validateCompoundField("years", 61)).toMatch(/Höchstens 60\sJahre/);
    expect(validateCompoundField("years", 2.5)).toMatch(/ganze Zahl/);
  });
});

describe("simple vs. compound interest", () => {
  it("matches the textbook example", () => {
    expect(simpleInterestValue(100, 5, 2)).toBeCloseTo(110, 8);
    expect(compoundValue(100, 5, 2)).toBeCloseTo(110.25, 8);
    expect(compoundValue(100, 5, 10)).toBeGreaterThan(simpleInterestValue(100, 5, 10));
  });
});

describe("pickChartPoints", () => {
  it("shows every year for short durations", () => {
    const points = calculateCompoundGrowth({ ...base, monthlyContribution: 10, years: 5 }).points;
    expect(pickChartPoints(points).map((point) => point.year)).toEqual([1, 2, 3, 4, 5]);
  });

  it("samples long durations and always includes the last year", () => {
    const points = calculateCompoundGrowth({ ...base, monthlyContribution: 10, years: 37 }).points;
    const years = pickChartPoints(points).map((point) => point.year);
    expect(years.length).toBeLessThanOrEqual(MAX_CHART_BARS);
    expect(years.at(-1)).toBe(37);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it("returns nothing for 0 years", () => {
    expect(pickChartPoints(calculateCompoundGrowth(base).points)).toEqual([]);
  });
});
