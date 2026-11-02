import { describe, expect, it } from "vitest";
import { sumBudgetRows, summarizeBudget } from "./budget";
import { purchasingPower } from "./inflation";

describe("budget", () => {
  it("sums rows and ignores negative or invalid amounts", () => {
    expect(
      sumBudgetRows([
        { id: "1", label: "A", amount: 10.5 },
        { id: "2", label: "B", amount: -5 },
        { id: "3", label: "C", amount: Number.NaN },
        { id: "4", label: "D", amount: 4.5 },
      ]),
    ).toBe(15);
  });

  it("computes a negative balance when spending exceeds income", () => {
    const summary = summarizeBudget(
      [{ id: "e", label: "Taschengeld", amount: 50 }],
      [{ id: "a", label: "Handy", amount: 70 }],
    );
    expect(summary).toEqual({ income: 50, expenses: 70, balance: -20 });
  });

  it("handles empty lists", () => {
    expect(summarizeBudget([], [])).toEqual({ income: 0, expenses: 0, balance: 0 });
  });
});

describe("purchasingPower", () => {
  it("matches the lesson example (100 € at 2 % for 10 years)", () => {
    expect(purchasingPower(100, 2, 10)).toBeCloseTo(82.03, 2);
  });

  it("returns the amount unchanged for 0 years and 0 for invalid input", () => {
    expect(purchasingPower(100, 3, 0)).toBe(100);
    expect(purchasingPower(Number.NaN, 2, 10)).toBe(0);
  });
});
