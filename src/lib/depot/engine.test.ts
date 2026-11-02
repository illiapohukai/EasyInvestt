import { NOW, instrument, quote } from "@/test/fixtures/depot";
import {
  OrderError,
  appendSnapshot,
  applyBuy,
  applySell,
  createPortfolio,
  prepareBuy,
  prepareSell,
  valuePortfolio,
  weightAfterBuy,
  withTransactionNote,
} from "./engine";
import { averagePrice, parseAmountCents, parseUnits } from "./money";
import type { PortfolioRecord } from "./types";

const ETF = instrument();
const STOCK = instrument({
  id: "test-stock",
  symbol: "TSTK",
  name: "Test AG",
  type: "stock",
  sector: "Energie",
});

function portfolio(cashCents = 100_000): PortfolioRecord {
  return createPortfolio({
    id: "p1",
    name: "Test",
    startingCashCents: cashCents,
    providerId: "test",
    dataMode: "demo",
    now: NOW,
  });
}

function buy(p: PortfolioRecord, inst = ETF, price = 100, units = 10_000, id = "t") {
  return applyBuy(p, prepareBuy(p, inst, quote(inst.id, price), { kind: "units", units }), NOW, id);
}

function expectOrderError(fn: () => unknown, code: OrderError["code"]) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(OrderError);
    expect((error as OrderError).code).toBe(code);
    return;
  }
  throw new Error(`Expected OrderError ${code}`);
}

describe("createPortfolio", () => {
  it("starts with cash only and a start snapshot", () => {
    const p = portfolio();
    expect(p.cashCents).toBe(100_000);
    expect(p.positions).toEqual([]);
    expect(p.snapshots).toHaveLength(1);
    expect(p.snapshots[0]).toMatchObject({ reason: "start", totalValueCents: 100_000 });
  });

  it("rejects a zero or negative starting balance", () => {
    for (const cents of [0, -1, 0.5]) {
      expectOrderError(
        () =>
          createPortfolio({
            id: "x",
            name: "",
            startingCashCents: cents,
            providerId: "t",
            dataMode: "demo",
            now: NOW,
          }),
        "invalid-portfolio",
      );
    }
  });

  it("uses a default name when empty", () => {
    expect(
      createPortfolio({
        id: "x",
        name: "  ",
        startingCashCents: 100,
        providerId: "t",
        dataMode: "demo",
        now: NOW,
      }).name,
    ).toBe("Mein Übungsdepot");
  });
});

describe("buying", () => {
  it("first purchase reduces cash and creates a position", () => {
    const { portfolio: p, transaction } = buy(portfolio(), ETF, 100, 25_000); // 2.5 shares
    expect(p.cashCents).toBe(100_000 - 25_000);
    expect(p.positions).toHaveLength(1);
    expect(p.positions[0]).toMatchObject({ units: 25_000, costBasisCents: 25_000 });
    expect(transaction).toMatchObject({
      type: "buy",
      amountCents: 25_000,
      cashAfterCents: 75_000,
      simulated: true,
      realizedCents: 0,
    });
  });

  it("repeated purchase at a different price uses the weighted average price", () => {
    let p = buy(portfolio(), ETF, 100, 10_000).portfolio; // 1 share @ 100
    p = buy(p, ETF, 130, 20_000).portfolio; // 2 shares @ 130
    const position = p.positions[0]!;
    expect(position.units).toBe(30_000);
    expect(position.costBasisCents).toBe(10_000 + 26_000);
    expect(averagePrice(position.costBasisCents, position.units)).toBeCloseTo(120, 10);
    expect(p.positions).toHaveLength(1);
    expect(p.transactions).toHaveLength(2);
  });

  it("buys fractional shares by amount without exceeding it", () => {
    const order = prepareBuy(portfolio(), ETF, quote(ETF.id, 87.43), {
      kind: "amount",
      amountCents: 10_000,
    });
    expect(order.units).toBe(11_437); // 1.1437 shares
    expect(order.amountCents).toBe(9_999);
    expect(order.amountCents).toBeLessThanOrEqual(10_000);
  });

  it("rejects purchases that exceed the available cash", () => {
    const p = portfolio(10_000);
    expectOrderError(
      () => prepareBuy(p, ETF, quote(ETF.id, 100), { kind: "units", units: 10_001 }),
      "insufficient-cash",
    );
    expectOrderError(
      () => prepareBuy(p, ETF, quote(ETF.id, 100), { kind: "amount", amountCents: 10_001 }),
      "insufficient-cash",
    );
    // Exactly the available cash works.
    expect(
      prepareBuy(p, ETF, quote(ETF.id, 100), { kind: "units", units: 10_000 }).cashAfterCents,
    ).toBe(0);
  });

  it("re-validates cash when a stale preview is applied", () => {
    const p = portfolio(15_000);
    const order = prepareBuy(p, ETF, quote(ETF.id, 100), { kind: "units", units: 10_000 });
    const afterFirst = applyBuy(p, order, NOW, "a").portfolio;
    expectOrderError(() => applyBuy(afterFirst, order, NOW, "b"), "insufficient-cash");
  });

  it("rejects a missing or invalid price", () => {
    const p = portfolio();
    expectOrderError(
      () => prepareBuy(p, ETF, undefined, { kind: "units", units: 1 }),
      "missing-price",
    );
    expectOrderError(
      () => prepareBuy(p, ETF, quote(ETF.id, 0), { kind: "units", units: 1 }),
      "missing-price",
    );
    expectOrderError(
      () => prepareBuy(p, ETF, quote(ETF.id, Number.NaN), { kind: "units", units: 1 }),
      "missing-price",
    );
  });

  it("rejects non-euro instruments (no currency conversion)", () => {
    const usd = instrument({ id: "usd", currency: "USD" });
    expectOrderError(
      () =>
        prepareBuy(portfolio(), usd, quote("usd", 10, { currency: "USD" }), {
          kind: "units",
          units: 10_000,
        }),
      "unsupported-currency",
    );
  });

  it("rejects a quote for another instrument", () => {
    expectOrderError(
      () => prepareBuy(portfolio(), ETF, quote("other", 10), { kind: "units", units: 10_000 }),
      "instrument-mismatch",
    );
  });

  it("rejects zero, negative, fractional-unit and tiny orders", () => {
    const p = portfolio();
    const q = quote(ETF.id, 100);
    expectOrderError(() => prepareBuy(p, ETF, q, { kind: "units", units: 0 }), "invalid-units");
    expectOrderError(() => prepareBuy(p, ETF, q, { kind: "units", units: -5 }), "invalid-units");
    expectOrderError(() => prepareBuy(p, ETF, q, { kind: "units", units: 1.5 }), "invalid-units");
    expectOrderError(
      () => prepareBuy(p, ETF, q, { kind: "amount", amountCents: 0 }),
      "invalid-amount",
    );
    expectOrderError(() => prepareBuy(p, ETF, q, { kind: "units", units: 50 }), "below-minimum"); // 0.50 €
    expectOrderError(
      () => prepareBuy(p, ETF, quote(ETF.id, 5_000_000), { kind: "amount", amountCents: 100 }),
      "below-minimum",
    );
  });
});

describe("selling", () => {
  function held() {
    let p = buy(portfolio(), ETF, 100, 10_000, "a").portfolio;
    p = buy(p, ETF, 110, 10_000, "b").portfolio; // 2 shares, avg 105
    return p;
  }

  it("partial sale realises gain against the average price and keeps the average", () => {
    const p = held();
    const order = prepareSell(p, ETF.id, quote(ETF.id, 120), 5_000); // 0.5 shares
    expect(order).toMatchObject({
      proceedsCents: 6_000,
      costBasisCents: 5_250,
      realizedCents: 750,
      remainingUnits: 15_000,
    });
    const { portfolio: after, transaction } = applySell(p, order, NOW, "s");
    const position = after.positions[0]!;
    expect(position.units).toBe(15_000);
    expect(position.costBasisCents).toBe(15_750);
    expect(averagePrice(position.costBasisCents, position.units)).toBeCloseTo(105, 10);
    expect(after.cashCents).toBe(p.cashCents + 6_000);
    expect(transaction).toMatchObject({ type: "sell", realizedCents: 750, simulated: true });
  });

  it("full sale removes the position and books the complete cost basis", () => {
    const p = held();
    const { portfolio: after } = applySell(
      p,
      prepareSell(p, ETF.id, quote(ETF.id, 90), 20_000),
      NOW,
      "s",
    );
    expect(after.positions).toEqual([]);
    expect(after.transactions.at(-1)).toMatchObject({
      costBasisCents: 21_000,
      realizedCents: -3_000,
    });
    expect(after.cashCents).toBe(100_000 - 21_000 + 18_000);
    // History is kept.
    expect(after.transactions).toHaveLength(3);
  });

  it("prevents overselling and selling unknown positions", () => {
    const p = held();
    expectOrderError(() => prepareSell(p, ETF.id, quote(ETF.id, 100), 20_001), "oversell");
    expectOrderError(() => prepareSell(p, "unknown", quote("unknown", 100), 1), "no-position");
    expectOrderError(() => prepareSell(p, ETF.id, quote(ETF.id, 100), 0), "invalid-units");
    expectOrderError(() => prepareSell(p, ETF.id, undefined, 1), "missing-price");
  });

  it("prevents selling twice with the same preview", () => {
    const p = held();
    const order = prepareSell(p, ETF.id, quote(ETF.id, 100), 20_000);
    const after = applySell(p, order, NOW, "s").portfolio;
    expectOrderError(() => applySell(after, order, NOW, "s2"), "no-position");
  });
});

describe("valuation", () => {
  it("separates realised and unrealised gains and matches total value − start", () => {
    let p = buy(portfolio(), ETF, 100, 20_000, "a").portfolio; // 2 @ 100
    p = buy(p, STOCK, 50, 20_000, "b").portfolio; // 2 @ 50
    p = applySell(p, prepareSell(p, ETF.id, quote(ETF.id, 110), 10_000), NOW, "s").portfolio; // +10 realised
    const v = valuePortfolio(p, { [ETF.id]: quote(ETF.id, 120), [STOCK.id]: quote(STOCK.id, 40) });
    expect(v.realizedCents).toBe(1_000);
    expect(v.unrealizedCents).toBe(2_000 - 2_000); // ETF +20, stock −20
    expect(v.totalValueCents).toBe(v.cashCents + v.positionsValueCents);
    expect(v.totalGainCents).toBe(v.totalValueCents - 100_000);
    expect(v.totalGainCents).toBe(v.realizedCents + v.unrealizedCents);
    expect(v.performancePercent).toBeCloseTo(1, 10);
    expect(v.complete).toBe(true);
  });

  it("falls back to the last trade price when a quote is missing and flags it", () => {
    const p = buy(portfolio(), ETF, 100, 10_000).portfolio;
    const v = valuePortfolio(p, {});
    expect(v.positions[0]).toMatchObject({
      priceSource: "last-trade",
      price: 100,
      valueCents: 10_000,
    });
    expect(v.complete).toBe(false);
    expect(v.missingQuoteCount).toBe(1);
    // Quotes in another currency are not used either.
    expect(valuePortfolio(p, { [ETF.id]: quote(ETF.id, 1, { currency: "USD" }) }).complete).toBe(
      false,
    );
  });

  it("computes weights including cash and sorts by value", () => {
    let p = buy(portfolio(), ETF, 100, 10_000).portfolio;
    p = buy(p, STOCK, 50, 60_000).portfolio;
    const v = valuePortfolio(p, { [ETF.id]: quote(ETF.id, 100), [STOCK.id]: quote(STOCK.id, 50) });
    expect(v.positions.map((x) => x.position.instrument.id)).toEqual([STOCK.id, ETF.id]);
    expect(v.positions[0]!.weightPercent).toBeCloseTo(30, 10);
    expect(v.cashWeightPercent).toBeCloseTo(60, 10);
  });

  it("handles a portfolio whose positions are worth almost nothing", () => {
    const p = buy(portfolio(1_000), ETF, 10, 1_000).portfolio; // 0.1 shares, 1 €
    const v = valuePortfolio(p, { [ETF.id]: quote(ETF.id, 0.01) });
    expect(v.positionsValueCents).toBe(0);
    expect(v.positions[0]!.unrealizedPercent).toBeCloseTo(-100, 10);
    expect(Number.isFinite(v.positions[0]!.weightPercent)).toBe(true);
  });

  it("an all-cash portfolio has 0 % performance and 100 % cash", () => {
    const v = valuePortfolio(portfolio(), {});
    expect(v.totalGainCents).toBe(0);
    expect(v.performancePercent).toBe(0);
    expect(v.cashWeightPercent).toBe(100);
    expect(v.complete).toBe(true);
  });

  it("predicts the weight after a purchase", () => {
    const p = portfolio();
    const order = prepareBuy(p, STOCK, quote(STOCK.id, 50), {
      kind: "amount",
      amountCents: 42_000,
    });
    expect(weightAfterBuy(valuePortfolio(p, {}), order)).toBeCloseTo(42, 10);
  });
});

describe("snapshots and notes", () => {
  it("appends transaction snapshots and replaces same-day refresh snapshots", () => {
    let p = portfolio();
    const v = valuePortfolio(p, {});
    p = appendSnapshot(p, v, "refresh", new Date("2026-11-02T10:00:00Z"));
    p = appendSnapshot(p, v, "refresh", new Date("2026-11-02T11:00:00Z"));
    expect(p.snapshots.map((s) => s.reason)).toEqual(["start", "refresh"]);
    p = appendSnapshot(p, v, "buy", new Date("2026-11-02T11:30:00Z"));
    p = appendSnapshot(p, v, "refresh", new Date("2026-11-02T12:00:00Z"));
    expect(p.snapshots.map((s) => s.reason)).toEqual(["start", "refresh", "buy", "refresh"]);
  });

  it("stores and removes a reflection note", () => {
    const { portfolio: p, transaction } = buy(portfolio());
    const withNote = withTransactionNote(p, transaction.id, "  Zu viel in einer Aktie?  ");
    expect(withNote.transactions[0]!.note).toBe("Zu viel in einer Aktie?");
    expect(
      withTransactionNote(withNote, transaction.id, " ").transactions[0]!.note,
    ).toBeUndefined();
  });
});

describe("input parsing", () => {
  it("parses euro amounts into cents", () => {
    expect(parseAmountCents("1.000")).toEqual({ ok: true, value: 100_000 });
    expect(parseAmountCents("49,50")).toEqual({ ok: true, value: 4_950 });
    expect(parseAmountCents("0")).toMatchObject({ ok: false });
    expect(parseAmountCents("-5")).toMatchObject({ ok: false });
    expect(parseAmountCents("1,234")).toMatchObject({ ok: false });
    expect(parseAmountCents("abc")).toMatchObject({ ok: false });
  });

  it("parses quantities with up to four decimals", () => {
    expect(parseUnits("2")).toEqual({ ok: true, value: 20_000 });
    expect(parseUnits("0,0001")).toEqual({ ok: true, value: 1 });
    expect(parseUnits("1,5")).toEqual({ ok: true, value: 15_000 });
    expect(parseUnits("0,00001")).toMatchObject({ ok: false });
    expect(parseUnits("-1")).toMatchObject({ ok: false });
    expect(parseUnits("")).toMatchObject({ ok: false });
  });
});
