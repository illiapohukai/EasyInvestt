import { useState } from "react";
import { ChartPie } from "lucide-react";
import { formatCents, formatPercent } from "@/lib/format";
import { allocationBySector, allocationByType, type AllocationSlice } from "@/lib/depot/analysis";
import type { PortfolioValuation } from "@/lib/depot/engine";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "bg-primary",
  "bg-info",
  "bg-warning",
  "bg-primary-strong",
  "bg-destructive/80",
];

function roundedPercent(value: number): string {
  return formatPercent(Math.round(value * 10) / 10);
}

function Bars({ slices, label }: { slices: AllocationSlice[]; label: string }) {
  return (
    <ul aria-label={label} className="space-y-3">
      {slices.map((slice, index) => (
        <li key={slice.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
            <span className="min-w-0 font-medium break-words">{slice.label}</span>
            <span className="shrink-0 text-right font-semibold tabular-nums">
              {roundedPercent(slice.percent)}
              <span className="ml-2 font-normal text-muted-foreground">
                {formatCents(slice.valueCents)}
              </span>
            </span>
          </div>
          <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                slice.key === "cash"
                  ? "hatch bg-chart-contribution"
                  : BAR_COLORS[index % BAR_COLORS.length],
              )}
              style={{ width: `${Math.max(slice.percent, slice.percent > 0 ? 1 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Allocation by asset type and – if sector data exists – by sector. */
export function AllocationOverview({ valuation }: { valuation: PortfolioValuation }) {
  const byType = allocationByType(valuation);
  const bySector = allocationBySector(valuation);
  const [view, setView] = useState<"type" | "sector">("type");
  const active = view === "sector" && bySector ? "sector" : "type";

  return (
    <section aria-labelledby="aufteilung-titel" className="surface space-y-4 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 id="aufteilung-titel" className="flex items-center gap-2 text-lg font-bold">
          <ChartPie aria-hidden="true" className="size-5 text-primary" />
          Aufteilung
        </h2>
        <p className="text-sm text-muted-foreground">
          {active === "type"
            ? "Anteil am gesamten Depotwert, Guthaben eingeschlossen."
            : "Anteil der Branchen an deinen Einzelaktien. ETFs streuen selbst über viele Branchen und sind hier nicht enthalten."}
        </p>
      </div>
      {bySector ? (
        <div role="group" aria-label="Aufteilung anzeigen nach" className="flex flex-wrap gap-2">
          {(
            [
              ["type", "Nach Anlageart"],
              ["sector", "Branchen der Aktien"],
            ] as const
          ).map(([key, text]) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => setView(key)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                active === key
                  ? "border-primary bg-primary-soft text-primary-strong"
                  : "border-input bg-card hover:bg-muted",
              )}
            >
              {text}
            </button>
          ))}
        </div>
      ) : null}
      {active === "sector" && bySector ? (
        <Bars slices={bySector} label="Aufteilung der Einzelaktien nach Branche" />
      ) : (
        <Bars slices={byType} label="Aufteilung nach Anlageart" />
      )}
    </section>
  );
}
