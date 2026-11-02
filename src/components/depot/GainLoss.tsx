import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatSignedCents, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface GainLossProps {
  cents: number;
  percent?: number | null;
  className?: string;
  /** "onDark" for use on the dark summary card. */
  tone?: "default" | "onDark";
  size?: "sm" | "md";
}

/**
 * Gain or loss with sign, arrow icon and a screen-reader label.
 * Colour is only an additional hint.
 */
export function GainLoss({
  cents,
  percent,
  className,
  tone = "default",
  size = "md",
}: GainLossProps) {
  const direction = Math.abs(cents) < 1 ? "flat" : cents > 0 ? "up" : "down";
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const label = direction === "up" ? "Gewinn" : direction === "down" ? "Verlust" : "Unverändert";
  const color =
    tone === "onDark"
      ? "text-white"
      : direction === "up"
        ? "text-primary-strong"
        : direction === "down"
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-1.5 font-semibold tabular-nums",
        size === "sm" ? "text-sm" : "text-[0.9375rem]",
        color,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={size === "sm" ? "size-4 shrink-0" : "size-[1.125rem] shrink-0"}
      />
      <span className="sr-only">{label}: </span>
      <span className="whitespace-nowrap">{formatSignedCents(cents)}</span>
      {percent !== undefined && percent !== null ? (
        <span className="whitespace-nowrap">({formatSignedPercent(percent)})</span>
      ) : null}
    </span>
  );
}
