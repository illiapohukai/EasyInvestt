import { CalendarRange } from "lucide-react";
import { formatCents, formatDateTime, formatPercent, formatSignedPercent } from "@/lib/format";
import type { WeeklyReport } from "@/lib/depot/analysis";
import { GainLoss } from "./GainLoss";

/** Simple weekly summary – only numbers, no explanations of causes. */
export function WeeklyReportCard({ report }: { report: WeeklyReport | null }) {
  return (
    <section aria-labelledby="wochenbericht-titel" className="surface space-y-3 p-4 sm:p-5">
      <h2 id="wochenbericht-titel" className="flex items-center gap-2 text-lg font-bold">
        <CalendarRange aria-hidden="true" className="size-5 text-primary" />
        Wochenbericht
      </h2>
      {report ? (
        <>
          <p className="text-sm text-muted-foreground">
            Vergleich {formatDateTime(report.from)} bis {formatDateTime(report.to)}
          </p>
          <dl className="space-y-2 text-[0.9375rem]">
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt>Depotwert</dt>
              <dd className="text-right font-semibold tabular-nums">
                {formatCents(report.startValueCents)} → {formatCents(report.endValueCents)}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt>Veränderung</dt>
              <dd>
                <GainLoss cents={report.changeCents} percent={report.changePercent} size="sm" />
              </dd>
            </div>
            {report.strongest ? (
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt>Stärkste Position</dt>
                <dd className="text-right">
                  {report.strongest.name}{" "}
                  <span className="font-semibold tabular-nums">
                    {formatSignedPercent(report.strongest.changePercent)}
                  </span>
                </dd>
              </div>
            ) : null}
            {report.weakest ? (
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt>Schwächste Position</dt>
                <dd className="text-right">
                  {report.weakest.name}{" "}
                  <span className="font-semibold tabular-nums">
                    {formatSignedPercent(report.weakest.changePercent)}
                  </span>
                </dd>
              </div>
            ) : null}
            {report.largest ? (
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt>Größter Anteil</dt>
                <dd className="text-right">
                  {report.largest.name}{" "}
                  <span className="font-semibold tabular-nums">
                    {formatPercent(Math.round(report.largest.weightPercent))}
                  </span>
                </dd>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt>Neue Transaktionen seitdem</dt>
              <dd className="font-semibold tabular-nums">{report.transactionCount}</dd>
            </div>
          </dl>
          {report.notes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {report.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Der Bericht beschreibt nur Zahlen. Gründe für Kursänderungen kennt die App nicht.
          </p>
        </>
      ) : (
        <p className="text-[0.9375rem] text-muted-foreground">
          Noch nicht genügend Daten für einen Wochenbericht. Er erscheint, sobald dein Depot
          mindestens sieben Tage alt ist und Kurse aktualisiert wurden.
        </p>
      )}
    </section>
  );
}
