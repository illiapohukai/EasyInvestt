import { pickChartPoints } from "@/lib/finance/chart-points";
import type { YearPoint } from "@/lib/finance/compound-interest";
import { formatEuro, formatYearsDative } from "@/lib/format";

/** Bar chart (CSS only): paid-in amount and growth per year, stacked. */
export function GrowthChart({ points }: { points: readonly YearPoint[] }) {
  const bars = pickChartPoints(points);
  const last = bars.at(-1);
  if (!last) return null;

  const max = Math.max(...bars.map((bar) => Math.max(bar.value, bar.contributions)), 1);
  const label = `Diagramm: Nach ${formatYearsDative(last.year)} sind ${formatEuro(last.contributions)} eingezahlt und der Wert liegt bei ${formatEuro(last.value)}. Die Tabelle darunter enthält alle Werte.`;

  return (
    <figure className="space-y-3">
      <div role="img" aria-label={label} className="flex h-44 items-end gap-1.5 sm:gap-2.5">
        {bars.map((bar) => {
          const growth = Math.max(0, bar.value - bar.contributions);
          const contributionHeight = (Math.min(bar.contributions, bar.value) / max) * 100;
          const growthHeight = (growth / max) * 100;
          return (
            <div key={bar.year} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div
                className="hatch rounded-t-[3px] bg-chart-growth"
                style={{ height: `${growthHeight}%` }}
              />
              <div
                className={
                  growthHeight > 0
                    ? "bg-chart-contribution"
                    : "rounded-t-[3px] bg-chart-contribution"
                }
                style={{ height: `${contributionHeight}%` }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="flex gap-1.5 border-t border-border pt-1 sm:gap-2.5">
        {bars.map((bar) => (
          <span
            key={bar.year}
            className="min-w-0 flex-1 text-center text-xs text-muted-foreground tabular-nums"
          >
            {bar.year}
          </span>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Jahre</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-chart-contribution" />
          Eingezahlt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="hatch size-3 rounded-sm bg-chart-growth" />
          Wertzuwachs
        </span>
      </figcaption>

      <details className="rounded-lg border border-border">
        <summary className="flex min-h-11 items-center px-3 text-sm font-semibold">
          Werte als Tabelle anzeigen
        </summary>
        <div className="overflow-x-auto px-3 pb-3">
          <table className="w-full min-w-[16rem] text-left text-sm tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-1.5 pr-2 font-medium">
                  Jahr
                </th>
                <th scope="col" className="py-1.5 pr-2 text-right font-medium">
                  Eingezahlt
                </th>
                <th scope="col" className="py-1.5 pr-2 text-right font-medium">
                  Zuwachs
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Wert
                </th>
              </tr>
            </thead>
            <tbody>
              {points
                .filter((point) => point.year > 0)
                .map((point) => (
                  <tr key={point.year} className="border-t border-border">
                    <th scope="row" className="py-1.5 pr-2 font-medium">
                      {point.year}
                    </th>
                    <td className="py-1.5 pr-2 text-right">{formatEuro(point.contributions)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatEuro(point.growth)}</td>
                    <td className="py-1.5 text-right font-semibold">{formatEuro(point.value)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
