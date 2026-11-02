import { formatEuro } from "@/lib/format";

/** Stacked bar: how much of the final value was paid in vs. earned. */
export function ContributionSplit({
  contributions,
  growth,
}: {
  contributions: number;
  growth: number;
}) {
  const total = contributions + Math.max(0, growth);
  const contributionShare = total > 0 ? Math.round((contributions / total) * 100) : 0;
  const growthShare = total > 0 ? 100 - contributionShare : 0;

  return (
    <div>
      <div
        role="img"
        aria-label={`${contributionShare} Prozent eingezahlt, ${growthShare} Prozent Wertzuwachs`}
        className="flex h-4 overflow-hidden rounded-full bg-muted"
      >
        {total > 0 ? (
          <>
            <div
              className="h-full bg-chart-contribution"
              style={{ width: `${contributionShare}%` }}
            />
            <div className="hatch h-full bg-chart-growth" style={{ width: `${growthShare}%` }} />
          </>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-chart-contribution" />
          Eingezahlt: {formatEuro(contributions)} ({contributionShare} %)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="hatch size-3 rounded-sm bg-chart-growth" />
          Wertzuwachs: {formatEuro(Math.max(0, growth))} ({growthShare} %)
        </span>
      </div>
    </div>
  );
}
