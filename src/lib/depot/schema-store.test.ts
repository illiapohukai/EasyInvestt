import { NOW, instrument, quote } from "@/test/fixtures/depot";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress/model";
import { prepareBuy, prepareSell } from "./engine";
import { MIGRATIONS, parseDepotState } from "./schema";
import { __resetDepotStoreForTests, depotStore } from "./store";
import { DEPOT_STORAGE_KEY } from "./types";

const ETF = instrument();

function createAndBuy() {
  const portfolio = depotStore.createPortfolio({
    name: "Test",
    startingCashCents: 100_000,
    providerId: "test",
    dataMode: "demo",
    now: NOW,
  });
  const order = prepareBuy(portfolio, ETF, quote(ETF.id, 100), { kind: "units", units: 20_000 });
  depotStore.buy(order, NOW);
}

beforeEach(() => {
  localStorage.clear();
  __resetDepotStoreForTests();
});

describe("parseDepotState", () => {
  it("returns an empty state without data", () => {
    expect(parseDepotState(null)).toMatchObject({ issue: null, state: { portfolio: null } });
  });

  it("flags malformed data", () => {
    for (const raw of ["text", 42, [], { version: "1" }, { version: 1, portfolio: { id: 1 } }]) {
      expect(parseDepotState(raw).issue).toBe("malformed");
    }
  });

  it("rejects a ledger whose cash does not match the transactions", () => {
    createAndBuy();
    const stored = JSON.parse(localStorage.getItem(DEPOT_STORAGE_KEY)!);
    expect(parseDepotState(stored).issue).toBeNull();
    stored.portfolio.cashCents += 1;
    expect(parseDepotState(stored).issue).toBe("malformed");
  });

  it("drops broken cache entries but keeps the portfolio", () => {
    createAndBuy();
    const stored = JSON.parse(localStorage.getItem(DEPOT_STORAGE_KEY)!);
    stored.quotes.broken = { price: "x" };
    stored.portfolio.snapshots.push({ at: "kaputt" });
    const parsed = parseDepotState(stored);
    expect(parsed.issue).toBeNull();
    expect(Object.keys(parsed.state.quotes)).toEqual([ETF.id]);
    expect(parsed.state.portfolio?.snapshots).toHaveLength(2);
  });

  it("does not touch data from a newer app version", () => {
    expect(parseDepotState({ version: 99, portfolio: null }).issue).toBe("newer-version");
  });

  it("reports older versions without a migration and runs migrations step by step", () => {
    expect(parseDepotState({ version: 0 }).issue).toBe("unsupported-version");
    MIGRATIONS[0] = (data) => ({ ...data, version: 1, portfolio: null, quotes: {} });
    try {
      expect(parseDepotState({ version: 0 })).toMatchObject({ issue: null, state: { version: 1 } });
    } finally {
      delete MIGRATIONS[0];
    }
  });
});

describe("depotStore", () => {
  it("persists portfolio, transactions, quotes and snapshots across reloads", () => {
    createAndBuy();
    __resetDepotStoreForTests();
    const { state } = depotStore.getSnapshot();
    expect(state.portfolio?.cashCents).toBe(80_000);
    expect(state.portfolio?.positions[0]?.units).toBe(20_000);
    expect(state.portfolio?.transactions).toHaveLength(1);
    expect(state.portfolio?.snapshots.map((s) => s.reason)).toEqual(["start", "buy"]);
    expect(state.quotes[ETF.id]?.price).toBe(100);
  });

  it("records refresh snapshots only for held instruments", () => {
    createAndBuy();
    depotStore.applyQuotes([quote("other", 5)], NOW);
    expect(depotStore.getSnapshot().state.portfolio?.snapshots).toHaveLength(2);
    depotStore.applyQuotes([quote(ETF.id, 110)], NOW);
    const { state } = depotStore.getSnapshot();
    expect(state.portfolio?.snapshots.at(-1)).toMatchObject({
      reason: "refresh",
      totalValueCents: 102_000,
    });
    expect(state.lastRefreshAt).toBe(NOW.toISOString());
  });

  it("sells and removes the position after a full sale", () => {
    createAndBuy();
    const portfolio = depotStore.getSnapshot().state.portfolio!;
    depotStore.sell(prepareSell(portfolio, ETF.id, quote(ETF.id, 90), 20_000), NOW);
    const after = depotStore.getSnapshot().state.portfolio!;
    expect(after.positions).toEqual([]);
    expect(after.cashCents).toBe(98_000);
    expect(after.transactions.map((t) => t.type)).toEqual(["buy", "sell"]);
  });

  it("reset deletes the depot but keeps the learning progress", () => {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 1, completed: {}, opened: ["grundlagen"] }),
    );
    createAndBuy();
    const listener = vi.fn();
    const unsubscribe = depotStore.subscribe(listener);
    depotStore.reset();
    unsubscribe();
    expect(listener).toHaveBeenCalled();
    expect(localStorage.getItem(DEPOT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).not.toBeNull();
    expect(depotStore.getSnapshot().state.portfolio).toBeNull();
  });

  it("surfaces malformed storage and can dismiss the notice", () => {
    localStorage.setItem(DEPOT_STORAGE_KEY, "{kaputt");
    expect(depotStore.getSnapshot().issue).toBe("malformed");
    depotStore.dismissIssue();
    expect(depotStore.getSnapshot().issue).toBeNull();
  });

  it("is read-only for data from a newer version", () => {
    localStorage.setItem(DEPOT_STORAGE_KEY, JSON.stringify({ version: 2, portfolio: {} }));
    expect(depotStore.isReadOnly()).toBe(true);
    expect(() =>
      depotStore.buy(
        prepareBuy(
          {
            id: "x",
            name: "x",
            createdAt: NOW.toISOString(),
            baseCurrency: "EUR",
            providerId: "t",
            dataMode: "demo",
            startingCashCents: 100_000,
            cashCents: 100_000,
            positions: [],
            transactions: [],
            snapshots: [],
          },
          ETF,
          quote(ETF.id, 10),
          { kind: "units", units: 10_000 },
        ),
      ),
    ).toThrow();
    expect(JSON.parse(localStorage.getItem(DEPOT_STORAGE_KEY)!).version).toBe(2);
  });

  it("keeps working in memory when storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError");
    });
    try {
      createAndBuy();
      expect(depotStore.isPersisted()).toBe(false);
      expect(depotStore.getSnapshot().state.portfolio?.cashCents).toBe(80_000);
    } finally {
      spy.mockRestore();
    }
  });
});
