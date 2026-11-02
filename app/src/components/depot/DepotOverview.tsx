import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, History, Wallet } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { getMarketData } from "@/config/market-data";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { useQuoteRefresh } from "@/hooks/use-market-data";
import { useNow } from "@/hooks/use-now";
import { getInsights, getWeeklyReport, pricesUpdatedAt } from "@/lib/depot/analysis";
import { valuePortfolio } from "@/lib/depot/engine";
import { depotStore } from "@/lib/depot/store";
import type { DepotState, PortfolioRecord } from "@/lib/depot/types";
import { AllocationOverview } from "./AllocationOverview";
import {
  DepotDisclaimer,
  DemoDataNotice,
  MarketDataSourceNote,
  StoredDataIssueNotice,
} from "./DepotNotices";
import { DepotSkeleton } from "./DepotSkeleton";
import { DepotSummary } from "./DepotSummary";
import { InsightCard } from "./InsightCard";
import { MarketDataErrorNotice } from "./MarketDataErrorNotice";
import { Onboarding } from "./Onboarding";
import { PortfolioHistory } from "./PortfolioHistory";
import { PositionCard } from "./PositionCard";
import { providerMatches } from "./helpers";
import { ProviderMismatchNotice } from "./ProviderMismatchNotice";
import { TransactionList } from "./TransactionList";
import { WeeklyReportCard } from "./WeeklyReportCard";

function PortfolioView({ portfolio, state }: { portfolio: PortfolioRecord; state: DepotState }) {
  const now = useNow();
  const isDemo = getMarketData().provider.mode === "demo";
  const readOnly = depotStore.isReadOnly() || !providerMatches(portfolio);
  const ids = portfolio.positions.map((p) => p.instrument.id);
  const refresh = useQuoteRefresh(ids, state.quotes, !readOnly);
  const valuation = valuePortfolio(portfolio, state.quotes);
  const insights = getInsights(valuation);
  const report = getWeeklyReport(portfolio, valuation, now, isDemo);
  const errors = Object.values(refresh.errors);
  const firstError = errors[0];
  const recent = [...portfolio.transactions].reverse().slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Übungsdepot · Simulation"
        title={portfolio.name}
        description="Virtuelles Geld, simulierte Käufe und Verkäufe. Nichts davon ist eine echte Geldanlage."
      />
      <ProviderMismatchNotice portfolio={portfolio} />
      <DemoDataNotice />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-5">
          <DepotSummary
            portfolio={portfolio}
            valuation={valuation}
            isDemo={isDemo}
            lastUpdate={pricesUpdatedAt(portfolio, state.quotes) ?? state.lastRefreshAt}
            refreshing={refresh.status === "loading"}
            onRefresh={() => void refresh.refresh()}
            readOnly={readOnly}
          />
          {firstError ? (
            <MarketDataErrorNotice
              error={firstError}
              onRetry={() => void refresh.refresh()}
              context={`${errors.length === 1 ? "Ein Kurs konnte" : `${errors.length} Kurse konnten`} nicht aktualisiert werden. Angezeigt werden die zuletzt geladenen Werte mit ihrem Stand.`}
            />
          ) : null}
          <InsightCard insights={insights} />

          <section aria-labelledby="positionen-titel" className="space-y-3">
            <h2 id="positionen-titel" className="flex items-center gap-2 text-lg font-bold">
              <Wallet aria-hidden="true" className="size-5 text-primary" />
              Deine Positionen{" "}
              <span className="font-semibold text-muted-foreground tabular-nums">
                ({valuation.positions.length})
              </span>
            </h2>
            {valuation.positions.length > 0 ? (
              <ul className="space-y-3">
                {valuation.positions.map((item) => (
                  <li key={item.position.instrument.id}>
                    <PositionCard item={item} now={now} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-input px-4 py-5 text-[0.9375rem]">
                <p className="font-semibold">Noch keine Wertpapiere</p>
                <p className="mt-1 text-muted-foreground">
                  Wähle unter „Investieren“ ein Wertpapier aus. Tipp: Vergleiche einen breit
                  gestreuten ETF mit einer Einzelaktie.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <PortfolioHistory portfolio={portfolio} now={now} isDemo={isDemo} />
          <AllocationOverview valuation={valuation} />
          <WeeklyReportCard report={report} />

          <section aria-labelledby="transaktionen-titel" className="surface space-y-2 p-4 sm:p-5">
            <h2 id="transaktionen-titel" className="flex items-center gap-2 text-lg font-bold">
              <History aria-hidden="true" className="size-5 text-primary" />
              Letzte Transaktionen
            </h2>
            <TransactionList transactions={recent} />
            {portfolio.transactions.length > 0 ? (
              <Link
                to="/depot/transaktionen"
                className="inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-semibold text-primary underline underline-offset-4"
              >
                {portfolio.transactions.length === 1
                  ? "Transaktion ansehen und als CSV exportieren"
                  : `Alle ${portfolio.transactions.length} Transaktionen und CSV-Export`}
              </Link>
            ) : null}
          </section>

          <Link
            to="/lernen/$lessonId"
            params={{ lessonId: "anlageklassen" }}
            className="surface group flex items-center gap-4 p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Risiko verstehen</span>
              <span className="block text-[0.9375rem] text-muted-foreground">
                Thema „Anlageklassen“: Aktien, ETFs und Anleihen im Vergleich.
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          </Link>

          <section aria-labelledby="datenquelle-titel" className="surface space-y-3 p-4 sm:p-5">
            <h2 id="datenquelle-titel" className="text-lg font-bold">
              Über die Kurse
            </h2>
            <MarketDataSourceNote
              lastUpdate={pricesUpdatedAt(portfolio, state.quotes) ?? state.lastRefreshAt}
            />
          </section>
          <DepotDisclaimer />
        </div>
      </div>
    </div>
  );
}

export function DepotOverview() {
  const hydrated = useHydrated();
  const { state, issue } = useDepot();

  if (!hydrated) return <DepotSkeleton />;
  if (!state.portfolio) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Übungsdepot"
          title="Depot"
          description="Kaufen und verkaufen üben – mit virtuellem Geld und ohne Risiko."
        />
        <StoredDataIssueNotice issue={issue} />
        <DemoDataNotice compact />
        <Onboarding readOnly={issue === "newer-version"} />
      </div>
    );
  }
  return <PortfolioView portfolio={state.portfolio} state={state} />;
}
