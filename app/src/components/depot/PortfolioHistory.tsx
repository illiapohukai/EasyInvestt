import { useState } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import { formatCents, formatDate, formatDateTime, formatSignedPercent } from "@/lib/format";
import {
  HISTORY_PERIOD_LABELS,
  availablePeriods,
  hasEnoughHistory,
  historyPoints,
  type HistoryPeriod,
} from "@/lib/depot/analysis";
import type { PortfolioRecord, SnapshotReason } from "@/lib/depot/types";
import { cn } from "@/lib/utils";
import { LineChart } from "./LineChart";

const REASON_LABELS: Record<SnapshotReason, string> = {
  start: "Depotstart",
  buy: "Virtueller Kauf",
  sell: "Virtueller Verkauf",
  refresh: "Kurse aktualisiert",
};

/** Portfolio value over time, built only from recorded snapshots. */
export function PortfolioHistory({
  portfolio,
  now,
  isDemo,
}: {
  portfolio: PortfolioRecord;
  now: Date;
  isDemo: boolean;
}) {
  const periods = availablePeriods(portfolio.snapshots, now);
  const [selected, setSelected] = useState<HistoryPeriod>("alle");
  const period = periods.includes(selected) ? selected : "alle";
  const points = historyPoints(portfolio.snapshots, period, now);
  const enough = hasEnoughHistory(points);
  const first = points[0];
  const last = points.at(-1);
  const startDate = formatDate(portfolio.createdAt);

  let summary = "";
  if (enough && first && last) {
    const change =
      first.totalValueCents > 0
        ? ((last.totalValueCents - first.totalValueCents) / first.totalValueCents) * 100
        : 0;
    const period = `Vom ${formatDate(first.at)} bis ${formatDate(last.at)}`;
    summary =
      last.totalValueCents === first.totalValueCents
        ? `${period} blieb der Depotwert unverändert bei ${formatCents(last.totalValueCents)}. ${points.length} Messpunkte.`
        : `${period} ${
            last.totalValueCents > first.totalValueCents ? "stieg" : "sank"
          } der Depotwert von ${formatCents(first.totalValueCents)} auf ${formatCents(last.totalValueCents)} (${formatSignedPercent(change)}). ${points.length} Messpunkte.`;
  }

  return (
    <section aria-labelledby="verlauf-titel" className="surface space-y-4 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 id="verlauf-titel" className="flex items-center gap-2 text-lg font-bold">
          <LineChartIcon aria-hidden="true" className="size-5 text-primary" />
          Entwicklung
        </h2>
        <p className="text-sm text-muted-foreground">
          Verlauf erst ab deinem Depotstart am {startDate}. Werte entstehen nur bei Käufen,
          Verkäufen und Kursaktualisierungen{isDemo ? " – hier mit Beispielkursen" : ""}.
        </p>
      </div>

      {periods.length > 1 ? (
        <div role="group" aria-label="Zeitraum" className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={p === period}
              onClick={() => setSelected(p)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                p === period
                  ? "border-primary bg-primary-soft text-primary-strong"
                  : "border-input bg-card hover:bg-muted",
              )}
            >
              {HISTORY_PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      ) : null}

      {enough ? (
        <>
          <LineChart
            points={points.map((p) => ({ x: Date.parse(p.at), y: p.totalValueCents }))}
            label={summary}
            formatY={(v) => formatCents(Math.round(v))}
            formatX={(v) => formatDate(new Date(v).toISOString())}
            baseline={{ value: portfolio.startingCashCents, label: "Startguthaben" }}
          />
          <p className="text-[0.9375rem]">{summary}</p>
          <details className="rounded-lg border border-border">
            <summary className="flex min-h-11 items-center px-3 text-[0.9375rem] font-semibold">
              Messpunkte als Liste
            </summary>
            <ul className="divide-y divide-border border-t border-border text-sm">
              {[...points].reverse().map((p, index) => {
                const snapshot = portfolio.snapshots.find((s) => s.at === p.at);
                return (
                  <li
                    key={`${p.at}-${index}`}
                    className="flex flex-wrap justify-between gap-x-3 px-3 py-2"
                  >
                    <span>
                      {formatDateTime(p.at)}
                      {snapshot ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {REASON_LABELS[snapshot.reason]}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCents(p.totalValueCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-input px-4 py-5 text-[0.9375rem]">
          <p className="font-semibold">Für diesen Zeitraum gibt es noch nicht genügend Daten.</p>
          <p className="mt-1 text-muted-foreground">
            Bisher{" "}
            {points.length === 1
              ? "gibt es einen Messpunkt"
              : `gibt es ${points.length} Messpunkte`}
            . Eine Linie entsteht, sobald Werte von mindestens zwei Tagen vorliegen. Für die Zeit
            vor deinem Depotstart werden keine Werte erfunden.
          </p>
        </div>
      )}
    </section>
  );
}
