import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { __setMarketDataProviderForTests } from "@/config/market-data";
import { createDemoProvider } from "@/lib/market-data/demo-provider";
import { DEMO_INSTRUMENTS } from "@/lib/market-data/demo/instruments";
import { prepareBuy } from "@/lib/depot/engine";
import { __resetDepotStoreForTests, depotStore } from "@/lib/depot/store";
import { DEPOT_STORAGE_KEY } from "@/lib/depot/types";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress/model";
import { __resetProgressStoreForTests, progressStore } from "@/lib/progress/store";
import { renderWithRouter } from "@/test/render-with-router";
import { BuyFlow } from "./BuyFlow";
import { DepotOverview } from "./DepotOverview";
import { DepotReset } from "./DepotReset";
import { SellFlow } from "./SellFlow";

const WORLD = DEMO_INSTRUMENTS.find((i) => i.id === "demo-welt")!;
const provider = createDemoProvider();

beforeEach(() => {
  localStorage.clear();
  __resetDepotStoreForTests();
  __resetProgressStoreForTests();
  __setMarketDataProviderForTests(provider);
});

async function createDepotWithWorldEtf(units = 20_000) {
  const portfolio = depotStore.createPortfolio({
    name: "Test-Depot",
    startingCashCents: 100_000,
    providerId: provider.info.id,
    dataMode: "demo",
  });
  const quote = await provider.getQuote(WORLD.id);
  depotStore.buy(prepareBuy(portfolio, WORLD, quote, { kind: "units", units }));
}

describe("Übungsdepot – Oberfläche", () => {
  it("führt durch das Onboarding und legt ein Depot an", async () => {
    renderWithRouter(DepotOverview, "/depot");
    expect(
      await screen.findByText(/Beispieldaten – keine aktuellen Marktdaten/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));
    fireEvent.click(screen.getByLabelText(/5\.000/));
    fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));
    fireEvent.click(screen.getByRole("button", { name: /Verstanden/ }));
    fireEvent.click(screen.getByRole("button", { name: /Übungsdepot anlegen/ }));
    await waitFor(() =>
      expect(depotStore.getSnapshot().state.portfolio?.startingCashCents).toBe(500_000),
    );
    expect(
      await screen.findByText("Für diesen Zeitraum gibt es noch nicht genügend Daten."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Noch nicht genügend Daten für einen Wochenbericht\./),
    ).toBeInTheDocument();
  });

  it("kauft virtuell mit Vorschau, Bestätigung und Reflexionsfrage", async () => {
    depotStore.createPortfolio({
      name: "Test-Depot",
      startingCashCents: 100_000,
      providerId: provider.info.id,
      dataMode: "demo",
    });
    renderWithRouter(() => <BuyFlow instrumentId={WORLD.id} />, "/depot/kaufen");
    await screen.findByText(/Stand/);
    fireEvent.change(screen.getByLabelText("Betrag"), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: /Weiter zur Vorschau/ }));
    expect(
      await screen.findByRole("heading", { name: "Virtuellen Kauf prüfen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Anteil am Depot danach")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Virtuell kaufen" }));
    expect(
      await screen.findByRole("heading", { name: /Virtueller Kauf ausgeführt/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Welches Risiko entsteht, wenn diese Position einen großen Anteil deines Depots bildet?",
      ),
    ).toBeInTheDocument();
    const portfolio = depotStore.getSnapshot().state.portfolio!;
    expect(portfolio.positions).toHaveLength(1);
    expect(portfolio.cashCents).toBe(100_000 - portfolio.transactions[0]!.amountCents);
  });

  it("verhindert Käufe über dem verfügbaren Guthaben", async () => {
    depotStore.createPortfolio({
      name: "Test-Depot",
      startingCashCents: 100_000,
      providerId: provider.info.id,
      dataMode: "demo",
    });
    renderWithRouter(() => <BuyFlow instrumentId={WORLD.id} />, "/depot/kaufen");
    await screen.findByText(/Stand/);
    fireEvent.change(screen.getByLabelText("Betrag"), { target: { value: "1500" } });
    expect(await screen.findByText(/reicht dein virtuelles Guthaben nicht/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Weiter zur Vorschau/ }));
    expect(
      screen.queryByRole("heading", { name: "Virtuellen Kauf prüfen" }),
    ).not.toBeInTheDocument();
  });

  it("verhindert Verkäufe über dem Bestand und verkauft alles mit realisiertem Ergebnis", async () => {
    await createDepotWithWorldEtf(20_000);
    renderWithRouter(() => <SellFlow instrumentId={WORLD.id} />, "/depot/verkaufen");
    await screen.findByText(/Stand/);
    const field = screen.getByLabelText("Anzahl Stück zum Verkaufen");
    fireEvent.change(field, { target: { value: "3" } });
    expect(
      await screen.findByText(/Leerverkäufe sind im Übungsdepot nicht möglich/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Alles/ }));
    expect(field).toHaveValue("2");
    fireEvent.click(screen.getByRole("button", { name: /Weiter zur Vorschau/ }));
    const preview = await screen.findByRole("heading", { name: "Virtuellen Verkauf prüfen" });
    const section = preview.closest("section")!;
    expect(within(section).getByText("0 – Position wird geschlossen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Virtuell verkaufen" }));
    expect(
      await screen.findByRole("heading", { name: /Virtueller Verkauf ausgeführt/ }),
    ).toBeInTheDocument();
    const portfolio = depotStore.getSnapshot().state.portfolio!;
    expect(portfolio.positions).toHaveLength(0);
    expect(portfolio.transactions.map((t) => t.type)).toEqual(["buy", "sell"]);
  });

  it("setzt nur das Depot zurück, der Lernfortschritt bleibt", async () => {
    await createDepotWithWorldEtf();
    progressStore.openLesson("grundlagen");
    renderWithRouter(DepotReset, "/mehr");
    fireEvent.click(await screen.findByRole("button", { name: /Übungsdepot zurücksetzen/ }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByLabelText(/Auch Lernfortschritt löschen/)).not.toBeChecked();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Ja, Depot löschen" }));
    });
    expect(depotStore.getSnapshot().state.portfolio).toBeNull();
    expect(localStorage.getItem(DEPOT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(PROGRESS_STORAGE_KEY)).not.toBeNull();
    expect(await screen.findByText(/Dein Lernfortschritt bleibt erhalten/)).toBeInTheDocument();
  });
});
