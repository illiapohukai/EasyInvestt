import { parseLocaleNumber } from "@/lib/format";
import { SHARE_DECIMALS, UNITS_PER_SHARE } from "./types";

export function centsToEuro(cents: number): number {
  return cents / 100;
}

/** Value of a quantity at a price, in cents. */
export function valueCents(units: number, price: number): number {
  return Math.round((units * price) / 100);
}

/** Average purchase price per share in euro. */
export function averagePrice(costBasisCents: number, units: number): number {
  return units > 0 ? (costBasisCents * 100) / units : 0;
}

export function unitsToShares(units: number): number {
  return units / UNITS_PER_SHARE;
}

export type ParsedInput<T> = { ok: true; value: T } | { ok: false; error: string };

/** Parses a euro amount typed by the user into cents. */
export function parseAmountCents(input: string): ParsedInput<number> {
  const value = parseLocaleNumber(input);
  if (value === null)
    return { ok: false, error: "Bitte gib einen Betrag als Zahl ein, z. B. 100 oder 49,50." };
  if (value <= 0) return { ok: false, error: "Der Betrag muss größer als 0 € sein." };
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 1e-6) {
    return { ok: false, error: "Beträge haben höchstens zwei Nachkommastellen (Cent)." };
  }
  return { ok: true, value: cents };
}

/** Parses a share quantity typed by the user into units of 1/10,000 share. */
export function parseUnits(input: string): ParsedInput<number> {
  const value = parseLocaleNumber(input);
  if (value === null)
    return { ok: false, error: "Bitte gib eine Stückzahl als Zahl ein, z. B. 2 oder 0,5." };
  if (value <= 0) return { ok: false, error: "Die Stückzahl muss größer als 0 sein." };
  const units = Math.round(value * UNITS_PER_SHARE);
  if (Math.abs(value * UNITS_PER_SHARE - units) > 1e-6) {
    return {
      ok: false,
      error: `Bruchstücke sind möglich, aber höchstens mit ${SHARE_DECIMALS} Nachkommastellen (z. B. 0,0001).`,
    };
  }
  return { ok: true, value: units };
}
