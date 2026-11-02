import type { DemoInstrument } from "./instruments";

/**
 * Deterministic sample prices for the demo mode.
 *
 * Prices change once per weekday (Monday–Friday) and stay the same on
 * weekends. Every value is reproducible: the same instrument and date always
 * give the same price on every device. The numbers are invented and are not
 * related to any real security.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Monday, 5 January 2026 – first demo trading day (index 0). */
const ANCHOR_UTC_DAY = Date.UTC(2026, 0, 5) / DAY_MS;
const MAX_INDEX = 20_000;
const MARKET_VOLATILITY = 0.009;

function hashString(text: string): number {
  // FNV-1a, 32 bit
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededUniform(seed: string): number {
  // mulberry32, one step
  let t = (hashString(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967297;
}

function seededNormal(seed: string): number {
  const u1 = seededUniform(`${seed}:a`);
  const u2 = seededUniform(`${seed}:b`);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Calendar day of a local date, counted in days since 1970-01-01. */
function localDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

/** Index of the demo trading day for a local date. Weekends map to Friday. */
export function demoTradingDayIndex(date: Date): number {
  const days = localDayNumber(date) - ANCHOR_UTC_DAY;
  if (days <= 0) return 0;
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  return Math.min(MAX_INDEX, weeks * 5 + Math.min(rest, 4));
}

/** ISO date (YYYY-MM-DD) of a demo trading day. */
export function demoTradingDayDate(index: number): string {
  const safe = Math.max(0, Math.floor(index));
  const day = ANCHOR_UTC_DAY + Math.floor(safe / 5) * 7 + (safe % 5);
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

const cache = new Map<string, number[]>();

function marketMove(index: number): number {
  return MARKET_VOLATILITY * seededNormal(`market:${index}`);
}

/** Unrounded demo price series up to and including the given index. */
function series(instrument: DemoInstrument, upTo: number): number[] {
  let values = cache.get(instrument.id);
  if (!values) {
    values = [instrument.basePrice];
    cache.set(instrument.id, values);
  }
  for (let index = values.length; index <= upTo; index += 1) {
    const move =
      instrument.drift +
      instrument.beta * marketMove(index) +
      instrument.idioVol * seededNormal(`${instrument.id}:${index}`);
    const clamped = Math.max(-0.2, Math.min(0.2, move));
    const previous = values[index - 1] ?? instrument.basePrice;
    values.push(Math.max(0.01, previous * (1 + clamped)));
  }
  return values;
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Rounded demo closing price for a trading day index. */
export function demoPrice(instrument: DemoInstrument, index: number): number {
  const safe = Math.max(0, Math.min(MAX_INDEX, Math.floor(index)));
  return roundPrice(series(instrument, safe)[safe] ?? instrument.basePrice);
}
