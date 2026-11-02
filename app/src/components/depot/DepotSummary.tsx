import { Link } from "@tanstack/react-router";
import { ArrowDownToLine, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents, formatDateTime } from "@/lib/format";
import type { PortfolioValuation } from "@/lib/depot/engine";
import type { PortfolioRecord } from "@/lib/depot/types";
import { GainLoss } from "./GainLoss";

interface DepotSummaryProps {
  portfolio: PortfolioRecord;
  valuation: PortfolioValuation;
  isDemo: boolean;
  lastUpdate: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  readOnly: boolean;
}

/** Portfolio value, gains, cash and the main actions. */
export function DepotSummary({
  portfolio,
  valuation,
  isDemo,
  lastUpdate,
  refreshing,
  onRefresh,
  readOnly,
}: DepotSummaryProps) {
  const hasPositions = portfolio.positions.length > 0;
  return (
    <section aria-labelledby="depotwert-titel" className="space-y-4">
      <div className="rounded-2xl bg-primary-strong p-5 text-primary-foreground shadow-sm sm:p-6">
        <h2 id="depotwert-titel" className="text-sm font-semibold text-white/85">
          Virtueller Depotwert{isDemo ? " · Beispieldaten" : ""}
        </h2>
        <p className="mt-1 text-[clamp(1.75rem,8vw,2.5rem)] leading-tight font-bold tabular-nums [overflow-wrap:anywhere]">
          {formatCents(valuation.totalValueCents)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-white/90">
          <GainLoss
            cents={valuation.totalGainCents}
            percent={valuation.performancePercent}
            tone="onDark"
          />
          <span className="text-sm">seit Start mit {formatCents(portfolio.startingCashCents)}</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-sm">
          <div>
            <dt className="text-white/80">Verfügbares Guthaben</dt>
            <dd className="text-base font-bold tabular-nums">{formatCents(valuation.cashCents)}</dd>
          </div>
          <div>
            <dt className="text-white/80">Wert der Wertpapiere</dt>
            <dd className="text-base font-bold tabular-nums">
              {formatCents(valuation.positionsValueCents)}
            </dd>
          </div>
          <div>
            <dt className="text-white/80">Noch nicht realisiert</dt>
            <dd className="font-semibold tabular-nums">
              <GainLoss cents={valuation.unrealizedCents} tone="onDark" size="sm" />
            </dd>
          </div>
          <div>
            <dt className="text-white/80">Realisiert (Verkäufe)</dt>
            <dd className="font-semibold tabular-nums">
              <GainLoss cents={valuation.realizedCents} tone="onDark" size="sm" />
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-3 text-sm text-white/85">
          <p role="status">
            {refreshing
              ? "Kurse werden aktualisiert …"
              : lastUpdate
                ? `Kurse aktualisiert: ${formatDateTime(lastUpdate)}`
                : hasPositions
                  ? "Kurse noch nicht aktualisiert"
                  : "Noch keine Wertpapiere"}
          </p>
          {hasPositions ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing || readOnly}
              className="text-white hover:bg-white/15"
            >
              <RefreshCw aria-hidden="true" className={refreshing ? "animate-spin" : undefined} />
              Kurse aktualisieren
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-[400px]:flex-row">
        {readOnly ? (
          <>
            <Button size="lg" className="flex-1" disabled>
              <Plus aria-hidden="true" />
              Investieren
            </Button>
            {hasPositions ? (
              <Button size="lg" variant="secondary" className="flex-1" disabled>
                <ArrowDownToLine aria-hidden="true" />
                Verkaufen
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button asChild size="lg" className="flex-1">
              <Link to="/depot/kaufen" search={{}}>
                <Plus aria-hidden="true" />
                Investieren
              </Link>
            </Button>
            {hasPositions ? (
              <Button asChild size="lg" variant="secondary" className="flex-1">
                <Link to="/depot/verkaufen" search={{}}>
                  <ArrowDownToLine aria-hidden="true" />
                  Verkaufen
                </Link>
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
