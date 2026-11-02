import { Link } from "@tanstack/react-router";
import { ArrowRight, ChartPie, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketData } from "@/config/market-data";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatCents, formatDateTime } from "@/lib/format";
import { pricesUpdatedAt } from "@/lib/depot/analysis";
import { valuePortfolio } from "@/lib/depot/engine";
import { GainLoss } from "./GainLoss";

/**
 * Compact portfolio summary for the start screen. It only uses stored values –
 * the start screen never requests market data.
 */
export function DepotStartCard() {
  const hydrated = useHydrated();
  const { state } = useDepot();
  const isDemo = getMarketData().provider.mode === "demo";

  if (!hydrated) {
    return <div aria-hidden="true" className="surface h-36 animate-pulse bg-muted/40" />;
  }

  const portfolio = state.portfolio;
  if (!portfolio) {
    return (
      <section aria-labelledby="depot-start-titel" className="surface space-y-3 p-5">
        <h2 id="depot-start-titel" className="flex items-center gap-2 text-lg font-bold">
          <ChartPie aria-hidden="true" className="size-5 text-primary" />
          Starte dein Übungsdepot
        </h2>
        <p className="text-[0.9375rem] text-muted-foreground">
          Kaufen und verkaufen üben – mit virtuellem Startguthaben und ohne echtes Geld. So siehst
          du, wie Streuung und Schwankungen wirken.
        </p>
        <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
          <Link to="/depot">
            Übungsdepot starten
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
    );
  }

  const valuation = valuePortfolio(portfolio, state.quotes);
  const updated = pricesUpdatedAt(portfolio, state.quotes) ?? state.lastRefreshAt;
  return (
    <section aria-labelledby="depot-start-titel" className="surface space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="depot-start-titel" className="flex items-center gap-2 text-lg font-bold">
          <ChartPie aria-hidden="true" className="size-5 text-primary" />
          {portfolio.name}
        </h2>
        {isDemo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
            <FlaskConical aria-hidden="true" className="size-3.5" />
            Beispieldaten
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Virtueller Depotwert</p>
        <p className="text-2xl font-bold tabular-nums">{formatCents(valuation.totalValueCents)}</p>
        <div className="flex flex-wrap items-center gap-x-2 text-sm">
          <GainLoss
            cents={valuation.totalGainCents}
            percent={valuation.performancePercent}
            size="sm"
          />
          <span className="text-muted-foreground">seit Start</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {portfolio.positions.length === 1
          ? "1 Position"
          : `${portfolio.positions.length} Positionen`}{" "}
        · {updated ? `Kurse vom ${formatDateTime(updated)}` : "Kurse noch nicht aktualisiert"}
        {isDemo ? " · keine aktuellen Marktdaten" : ""}
      </p>
      <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
        <Link to="/depot">
          Depot öffnen
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
