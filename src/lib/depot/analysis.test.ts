import { NOW, instrument, quote } from "@/test/fixtures/depot";
import {
  allocationBySector,
  allocationByType,
  availablePeriods,
  getInsights,
  getWeeklyReport,
  hasEnoughHistory,
  historyPoints,
  pricesUpdatedAt,
} from "./analysis";
import { transactionsToCsv } from "./csv";
import { appendSnapshot, applyBuy, createPortfolio, prepareBuy, valuePortfolio } from "./engine";
import type { PortfolioRecord } from "./types";
import type { Instrument, Quote } from "@/lib/market-data/types";

const ETF = instrument({ holdingsCount: 1500 });
const SOLAR = instrument({
  id: "solar",
  symbol: "SOL",
  name: "Solar AG",
  type: "stock",
  sector: "Energie",
});
const WIND = instrument({
  id: "wind",
  symbol: "WND",
  name: "Wind AG",
  type: "stock",
  sector: "Energie",
});
const SOFT = instrument({
  id: "soft",
  symbol: "SFT",
  name: "Soft AG",
  type: "stock",
  sector: "Technologie",
});
const BANK = instrument({ id: "bank", symbol: "BNK", name: "Bank AG", type: "stock" });

function start(at = NOW): PortfolioRecord {
  return createPortfolio({
    id: "p",
    name: "T",
    startingCashCents: 100_000,
    providerId: "t",
    dataMode: "demo",
    now: at,
  });
}

function buyAmount(p: PortfolioRecord, inst: Instrument, euro: number, price = 10, at = NOW) {
  return applyBuy(
    p,
    prepareBuy(p, inst, quote(inst.id, price), { kind: "amount", amountCents: euro * 100 }),
    at,
    `${inst.id}-${at.getTime()}`,
  ).portfolio;
}

function quotesFor(...entries: [Instrument, number][]): Record<string, Quote> {
  return Object.fromEntries(entries.map(([inst, price]) => [inst.id, quote(inst.id, price)]));
}

describe("allocation", () => {
  it("groups by asset type including cash", () => {
    let p = buyAmount(start(), ETF, 500);
    p = buyAmount(p, SOLAR, 200);
    const slices = allocationByType(valuePortfolio(p, quotesFor([ETF, 10], [SOLAR, 10])));
    expect(slices.map((s) => [s.key, Math.round(s.percent)])).toEqual([
      ["etf", 50],
      ["cash", 30],
      ["stock", 20],
    ]);
  });

  it("returns no sector split without sector data", () => {
    const p = buyAmount(start(), BANK, 100);
    expect(allocationBySector(valuePortfolio(p, quotesFor([BANK, 10])))).toBeNull();
    expect(allocationBySector(valuePortfolio(buyAmount(start(), ETF, 100), {}))).toBeNull();
  });

  it("groups stocks without sector as 'Ohne Angabe'", () => {
    let p = buyAmount(start(), SOLAR, 300);
    p = buyAmount(p, BANK, 100);
    const sectors = allocationBySector(valuePortfolio(p, quotesFor([SOLAR, 10], [BANK, 10])));
    expect(sectors?.map((s) => [s.label, s.percent])).toEqual([
      ["Energie", 75],
      ["Ohne Angabe", 25],
    ]);
  });
});

describe("insights", () => {
  it("explains an all-cash portfolio", () => {
    expect(getInsights(valuePortfolio(start(), {}))[0]!.id).toBe("cash-only");
  });

  it("warns about a single stock with a large weight", () => {
    const p = buyAmount(start(), SOLAR, 420);
    const [first] = getInsights(valuePortfolio(p, quotesFor([SOLAR, 10])));
    expect(first!.id).toBe("single-stock-concentration");
    expect(first!.text).toContain("42\u00a0%");
  });

  it("detects sector concentration and many single stocks", () => {
    let p = buyAmount(start(), SOLAR, 100);
    p = buyAmount(p, WIND, 100);
    p = buyAmount(p, SOFT, 50);
    p = buyAmount(p, BANK, 50);
    const ids = getInsights(
      valuePortfolio(p, quotesFor([SOLAR, 10], [WIND, 10], [SOFT, 10], [BANK, 10])),
    ).map((i) => i.id);
    expect(ids).toContain("sector-concentration");
    expect(ids).toContain("many-stocks");
  });

  it("mentions a falling value with the real percentage", () => {
    const p = buyAmount(start(), ETF, 1_000);
    const insights = getInsights(valuePortfolio(p, quotesFor([ETF, 9])));
    const down = insights.find((i) => i.id === "value-down");
    expect(down?.text).toContain("-10\u00a0%");
  });

  it("ignores tiny changes such as one cent of rounding", () => {
    const p = buyAmount(start(), ETF, 1_000);
    const ids = getInsights(valuePortfolio(p, quotesFor([ETF, 10.001]))).map((i) => i.id);
    expect(ids).not.toContain("value-up");
    expect(ids).not.toContain("value-down");
  });

  it("puts missing quotes first", () => {
    const p = buyAmount(start(), ETF, 100);
    expect(getInsights(valuePortfolio(p, {}))[0]!.id).toBe("incomplete");
  });

  it("explains that a large ETF position is still spread", () => {
    const p = buyAmount(start(), ETF, 800);
    const insight = getInsights(valuePortfolio(p, quotesFor([ETF, 10]))).find(
      (i) => i.id === "large-fund",
    );
    expect(insight?.text).toContain("1.500");
  });
});

describe("history", () => {
  it("needs two calendar days of snapshots", () => {
    const p = start(new Date("2026-11-02T08:00:00Z"));
    const v = valuePortfolio(p, {});
    const sameDay = appendSnapshot(p, v, "refresh", new Date("2026-11-02T12:00:00Z"));
    expect(hasEnoughHistory(historyPoints(sameDay.snapshots, "alle", NOW))).toBe(false);
    const nextDay = appendSnapshot(sameDay, v, "refresh", new Date("2026-11-03T12:00:00Z"));
    expect(hasEnoughHistory(historyPoints(nextDay.snapshots, "alle", NOW))).toBe(true);
  });

  it("offers only periods covered by recorded data and never back-fills", () => {
    const created = new Date("2026-11-02T08:00:00Z");
    const p = start(created);
    expect(availablePeriods(p.snapshots, new Date("2026-11-05T08:00:00Z"))).toEqual(["alle"]);
    expect(availablePeriods(p.snapshots, new Date("2026-11-10T08:00:00Z"))).toEqual(["7T", "alle"]);
    expect(availablePeriods(p.snapshots, new Date("2026-12-05T08:00:00Z"))).toEqual([
      "7T",
      "30T",
      "alle",
    ]);
    const points = historyPoints(p.snapshots, "alle", new Date("2026-12-05T08:00:00Z"));
    expect(points).toHaveLength(1);
    expect(points[0]!.at).toBe(created.toISOString());
  });
});

describe("weekly report", () => {
  it("is not available before seven days of history", () => {
    const p = buyAmount(start(), ETF, 100);
    expect(
      getWeeklyReport(
        p,
        valuePortfolio(p, quotesFor([ETF, 10])),
        new Date("2026-11-08T09:00:00Z"),
        true,
      ),
    ).toBeNull();
  });

  it("summarises the last seven days from recorded snapshots", () => {
    const t0 = new Date("2026-11-02T08:00:00Z");
    let p = start(t0);
    p = buyAmount(p, ETF, 500, 10, t0);
    p = buyAmount(p, SOLAR, 300, 10, t0);
    p = appendSnapshot(p, valuePortfolio(p, quotesFor([ETF, 10], [SOLAR, 10])), "refresh", t0);
    const now = new Date("2026-11-10T08:00:00Z");
    const v = valuePortfolio(p, quotesFor([ETF, 11], [SOLAR, 9]));
    const report = getWeeklyReport(p, v, now, true)!;
    expect(report.startValueCents).toBe(100_000);
    expect(report.endValueCents).toBe(20_000 + 55_000 + 27_000);
    expect(report.changeCents).toBe(2_000);
    expect(report.strongest).toMatchObject({ symbol: "TETF" });
    expect(report.strongest!.changePercent).toBeCloseTo(10, 10);
    expect(report.weakest).toMatchObject({ symbol: "SOL" });
    expect(report.transactionCount).toBe(0);
    expect(report.notes[0]).toContain("Beispieldaten");
    expect(report.notes.some((n) => n.includes("Solar AG"))).toBe(true);
  });
});

describe("csv export", () => {
  it("exports simulated transactions with German number format and formula protection", () => {
    const evil = instrument({ id: "evil", name: "=HYPERLINK(1)", symbol: "EV" });
    const p = buyAmount(start(), evil, 100, 12.5);
    const csv = transactionsToCsv(p.transactions);
    expect(csv.startsWith("\ufeff")).toBe(true);
    const [header, row] = csv.slice(1).trim().split("\r\n");
    expect(header).toContain('"Simulation"');
    expect(row).toContain('"Virtueller Kauf"');
    expect(row).toContain('"\'=HYPERLINK(1)"');
    expect(row).toContain('"8,0000"');
    expect(row).toContain('"100,00"');
    expect(row).toContain('"ja"');
  });
});

describe("pricesUpdatedAt", () => {
  it("returns the oldest quote time of held positions", () => {
    let p = buyAmount(start(), ETF, 100);
    p = buyAmount(p, SOLAR, 100);
    const quotes = {
      [ETF.id]: quote(ETF.id, 10, { fetchedAt: "2026-11-02T09:00:00.000Z" }),
      [SOLAR.id]: quote(SOLAR.id, 10, { fetchedAt: "2026-11-02T08:00:00.000Z" }),
    };
    expect(pricesUpdatedAt(p, quotes)).toBe("2026-11-02T08:00:00.000Z");
    expect(pricesUpdatedAt(p, { [ETF.id]: quotes[ETF.id]! })).toBeNull();
  });
});
