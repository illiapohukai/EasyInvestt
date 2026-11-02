import { describe, expect, it } from "vitest";
import {
  formatEuro,
  formatPercent,
  formatYears,
  formatYearsDative,
  parseLocaleNumber,
} from "./format";

// Intl uses narrow no-break spaces; normalise them for readable assertions.
const plain = (value: string) => value.replace(/\s/g, " ");

describe("formatting", () => {
  it("formats euro amounts in German notation", () => {
    expect(plain(formatEuro(12345.6))).toBe("12.346 €");
    expect(plain(formatEuro(1234.5, { cents: true }))).toBe("1.234,50 €");
    expect(plain(formatEuro(-0.001))).toBe("0 €");
    expect(plain(formatEuro(Number.NaN))).toBe("0 €");
  });

  it("formats percentages and years", () => {
    expect(plain(formatPercent(5.5))).toBe("5,5 %");
    expect(plain(formatYears(1))).toBe("1 Jahr");
    expect(plain(formatYears(30))).toBe("30 Jahre");
    expect(plain(formatYearsDative(30))).toBe("30 Jahren");
    expect(plain(formatYearsDative(1))).toBe("1 Jahr");
  });
});

describe("parseLocaleNumber", () => {
  it.each([
    ["1500", 1500],
    ["1.500", 1500],
    ["1.000.000", 1_000_000],
    ["1.500,50", 1500.5],
    ["2,5", 2.5],
    ["2.5", 2.5],
    [" 50 € ", 50],
    ["7 %", 7],
    [",5", 0.5],
    ["-20", -20],
  ])("parses %j as %d", (input, expected) => {
    expect(parseLocaleNumber(input)).toBe(expected);
  });

  it.each(["", " ", "abc", "1,2,3", "12a", "1.50,0.1", "-", "e5"])("rejects %j", (input) => {
    expect(parseLocaleNumber(input)).toBeNull();
  });
});

describe("portfolio formats", () => {
  it("formats cents, signs, shares and prices", async () => {
    const f = await import("./format");
    expect(f.formatCents(123456)).toBe("1.234,56\u00a0€");
    expect(f.formatSignedCents(1234)).toBe("+12,34\u00a0€");
    expect(f.formatSignedCents(-1234)).toBe("-12,34\u00a0€");
    expect(f.formatSignedCents(0)).toBe("0,00\u00a0€");
    expect(f.formatSignedPercent(1.234)).toBe("+1,23\u00a0%");
    expect(f.formatSignedPercent(-0.001)).toBe("0,00\u00a0%");
    expect(f.formatShares(11437)).toBe("1,1437");
    expect(f.formatShares(20000)).toBe("2");
    expect(f.formatPrice(87.43)).toBe("87,43\u00a0€");
    expect(f.formatPrice(0.12345)).toBe("0,1235\u00a0€");
    expect(f.formatPriceTime("2026-11-06T12:00:00.000Z", "day")).toBe("06.11.2026");
    expect(f.formatDateTime("invalid")).toBe("–");
  });
});
