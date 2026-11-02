import { cn } from "@/lib/utils";

export interface ChartPoint {
  x: number;
  y: number;
}

interface LineChartProps {
  points: readonly ChartPoint[];
  /** Accessible summary of what the chart shows. */
  label: string;
  formatY: (value: number) => string;
  formatX: (value: number) => string;
  /** Optional reference line, e.g. the starting balance. */
  baseline?: { value: number; label: string };
  className?: string;
}

/**
 * Minimal responsive line chart (SVG). It scales to the container width and
 * keeps the line width constant. Labels are regular HTML text.
 */
export function LineChart({
  points,
  label,
  formatY,
  formatX,
  baseline,
  className,
}: LineChartProps) {
  if (points.length < 2) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y).concat(baseline ? [baseline.value] : []);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (maxY - minY < 1e-9) {
    const pad = Math.max(Math.abs(maxY) * 0.01, 1);
    minY -= pad;
    maxY += pad;
  }
  const padY = (maxY - minY) * 0.08;
  const lo = minY - padY;
  const hi = maxY + padY;
  const sx = (x: number) => (maxX === minX ? 50 : ((x - minX) / (maxX - minX)) * 100);
  const sy = (y: number) => 100 - ((y - lo) / (hi - lo)) * 100;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(3)},${sy(p.y).toFixed(3)}`)
    .join(" ");
  const area = `${line} L${sx(maxX).toFixed(3)},100 L${sx(minX).toFixed(3)},100 Z`;
  const last = points[points.length - 1] as ChartPoint;

  return (
    <figure className={cn("space-y-1.5", className)}>
      <div
        className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums"
        aria-hidden="true"
      >
        <span>{formatY(maxY)}</span>
      </div>
      <div role="img" aria-label={label} className="relative h-40 w-full sm:h-48">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <path d={area} className="fill-primary/10" />
          {baseline ? (
            <line
              x1="0"
              x2="100"
              y1={sy(baseline.value)}
              y2={sy(baseline.value)}
              className="stroke-muted-foreground"
              strokeWidth="1"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={line}
            fill="none"
            className="stroke-primary"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
          style={{ left: `${sx(last.x)}%`, top: `${sy(last.y)}%` }}
        />
      </div>
      <div
        className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums"
        aria-hidden="true"
      >
        <span>{formatY(minY)}</span>
        {baseline ? <span>– – {baseline.label}</span> : null}
      </div>
      <figcaption
        className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums"
        aria-hidden="true"
      >
        <span>{formatX(minX)}</span>
        <span>{formatX(maxX)}</span>
      </figcaption>
    </figure>
  );
}
