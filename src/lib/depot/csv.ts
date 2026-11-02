import { unitsToShares } from "./money";
import type { TransactionRecord } from "./types";

const STATUS_TEXT: Record<TransactionRecord["priceStatus"], string> = {
  realtime: "Echtzeit",
  delayed: "verzögert",
  eod: "Schlusskurs",
  demo: "Beispieldaten",
};

function decimal(value: number, digits: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  });
}

function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Free text (names, notes) must not start a spreadsheet formula. */
function text(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * Semicolon-separated CSV (German spreadsheet default) of all simulated
 * transactions. Starts with a byte-order mark so umlauts open correctly.
 */
export function transactionsToCsv(transactions: readonly TransactionRecord[]): string {
  const header = [
    "Datum",
    "Art",
    "Wertpapier",
    "Symbol",
    "Stück",
    "Kurs (EUR)",
    "Betrag (EUR)",
    "Realisierter Gewinn/Verlust (EUR)",
    "Guthaben danach (EUR)",
    "Kurs-Stand",
    "Datenstatus",
    "Simulation",
    "Notiz",
  ];
  const rows = transactions.map((t) => [
    t.at,
    t.type === "buy" ? "Virtueller Kauf" : "Virtueller Verkauf",
    text(t.name),
    text(t.symbol),
    decimal(unitsToShares(t.units), 4),
    decimal(t.price, 4),
    decimal(t.amountCents / 100, 2),
    t.type === "sell" ? decimal(t.realizedCents / 100, 2) : "",
    decimal(t.cashAfterCents / 100, 2),
    t.priceAsOf,
    STATUS_TEXT[t.priceStatus],
    "ja",
    text(t.note ?? ""),
  ]);
  return `\ufeff${[header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}
