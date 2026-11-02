import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { calculateCompoundGrowth, DEFAULT_COMPOUND_INPUT } from "@/lib/finance/compound-interest";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress/model";
import { __resetProgressStoreForTests } from "@/lib/progress/store";
import { describeResult } from "@/lib/finance/describe-result";
import { CompoundCalculator } from "./CompoundCalculator";

const plain = (value: string | null) => (value ?? "").replace(/\s/g, " ");

beforeEach(() => {
  window.localStorage.clear();
  __resetProgressStoreForTests();
});

describe("describeResult", () => {
  it("explains empty input", () => {
    const text = describeResult(
      calculateCompoundGrowth({
        initialAmount: 0,
        monthlyContribution: 0,
        annualReturnPercent: 5,
        years: 10,
      }),
    );
    expect(text).toMatch(/kein Vermögen/);
  });

  it("explains a zero return", () => {
    const text = plain(
      describeResult(
        calculateCompoundGrowth({
          initialAmount: 0,
          monthlyContribution: 50,
          annualReturnPercent: 0,
          years: 2,
        }),
      ),
    );
    expect(text).toContain("genau das, was du eingezahlt hast: 1.200 €");
  });

  it("summarises a normal scenario", () => {
    const text = plain(
      describeResult(calculateCompoundGrowth({ ...DEFAULT_COMPOUND_INPUT, initialAmount: 100 })),
    );
    expect(text).toContain("einmalig 100 € und jeden Monat 50 €");
    expect(text).toContain("5 % pro Jahr");
    expect(text).toContain("30 Jahren");
  });
});

describe("CompoundCalculator", () => {
  it("shows a validation message and keeps the last valid result", () => {
    render(<CompoundCalculator initial={DEFAULT_COMPOUND_INPUT} />);
    const before = plain(screen.getByText(/^Wenn du/).textContent);

    const rate = screen.getByLabelText("Rendite pro Jahr");
    fireEvent.change(rate, { target: { value: "20" } });
    expect(rate).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/^Höchstens 15\s%\.$/)).toBeInTheDocument();
    expect(screen.getByText(/Bitte prüfe die markierten Eingaben/)).toBeInTheDocument();
    expect(plain(screen.getByText(/^Wenn du/).textContent)).toBe(before);

    fireEvent.change(rate, { target: { value: "abc" } });
    expect(screen.getByText(/Bitte gib eine Zahl ein/)).toBeInTheDocument();

    fireEvent.change(rate, { target: { value: "2,5" } });
    expect(rate).not.toHaveAttribute("aria-invalid");
    expect(plain(screen.getByText(/^Wenn du/).textContent)).toContain("2,5 % pro Jahr");
  });

  it("accepts German thousands separators and saves the values", () => {
    render(<CompoundCalculator initial={DEFAULT_COMPOUND_INPUT} />);
    fireEvent.change(screen.getByLabelText("Startbetrag"), { target: { value: "1.000" } });
    const stored = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}");
    expect(stored.calculator.initialAmount).toBe(1000);
  });

  it("warns about optimistic returns and handles all-zero input", () => {
    render(<CompoundCalculator initial={DEFAULT_COMPOUND_INPUT} />);
    fireEvent.change(screen.getByLabelText("Rendite pro Jahr"), { target: { value: "10" } });
    expect(screen.getByText("Sehr optimistisch")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Monatliche Sparrate"), { target: { value: "0" } });
    expect(screen.getByText(/kein Vermögen/)).toBeInTheDocument();
    expect(screen.queryByText("So wächst dein Geld")).not.toBeInTheDocument();
  });

  it("applies rate presets", () => {
    render(<CompoundCalculator initial={DEFAULT_COMPOUND_INPUT} />);
    fireEvent.click(screen.getByRole("button", { name: /^7\s%$/ }));
    expect(screen.getByLabelText("Rendite pro Jahr")).toHaveValue("7");
    expect(screen.getByRole("button", { name: /^7\s%$/ })).toHaveAttribute("aria-pressed", "true");
  });
});
