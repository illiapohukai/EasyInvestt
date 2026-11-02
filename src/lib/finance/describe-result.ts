import type { CompoundResult } from "./compound-interest";
import { formatEuro, formatPercent, formatYearsDative } from "@/lib/format";

/** Plain-language summary of a calculator result (German). */
export function describeResult(result: CompoundResult): string {
  const { input, finalValue, totalContributions, growth } = result;
  if (input.initialAmount === 0 && input.monthlyContribution === 0) {
    return "Ohne Startbetrag und ohne Sparrate entsteht kein Vermögen. Trag oben einen Betrag ein.";
  }
  if (input.years === 0) {
    return `Bei 0 Jahren Anlagedauer bleibt es beim Startbetrag von ${formatEuro(input.initialAmount)}.`;
  }

  const parts: string[] = [];
  if (input.initialAmount > 0) parts.push(`einmalig ${formatEuro(input.initialAmount)}`);
  if (input.monthlyContribution > 0)
    parts.push(`jeden Monat ${formatEuro(input.monthlyContribution)}`);
  const what = `Wenn du ${parts.join(" und ")} anlegst`;

  if (input.annualReturnPercent === 0) {
    return `${what} und es keine Rendite gibt, hast du nach ${formatYearsDative(input.years)} genau das, was du eingezahlt hast: ${formatEuro(totalContributions)}.`;
  }
  return `${what} und das Geld im Schnitt ${formatPercent(input.annualReturnPercent)} pro Jahr bringt, hast du nach ${formatYearsDative(input.years)} rund ${formatEuro(finalValue)}. Davon hast du ${formatEuro(totalContributions)} selbst eingezahlt, ${formatEuro(growth)} sind Zinsen und Erträge – vor Steuern, Kosten und Inflation.`;
}
