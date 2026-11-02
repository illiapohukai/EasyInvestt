import type { YearPoint } from "./compound-interest";

export const MAX_CHART_BARS = 10;

/** Picks up to MAX_CHART_BARS evenly spaced years, always including the last one. */
export function pickChartPoints(points: readonly YearPoint[]): YearPoint[] {
  const withoutStart = points.filter((point) => point.year > 0);
  const lastPoint = withoutStart.at(-1);
  if (!lastPoint || withoutStart.length <= MAX_CHART_BARS) return withoutStart;
  const lastYear = lastPoint.year;
  const picked = new Map<number, YearPoint>();
  for (let index = 1; index <= MAX_CHART_BARS; index++) {
    const year = Math.round((lastYear * index) / MAX_CHART_BARS);
    const point = withoutStart.find((item) => item.year === year);
    if (point) picked.set(year, point);
  }
  return [...picked.values()];
}
