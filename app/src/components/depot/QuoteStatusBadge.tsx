import {
  AlertTriangle,
  Archive,
  CalendarCheck,
  CircleSlash,
  Clock,
  FlaskConical,
  RadioTower,
  type LucideIcon,
} from "lucide-react";
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from "@/lib/market-data/status";
import type { DisplayQuoteStatus } from "@/lib/market-data/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<DisplayQuoteStatus, { icon: LucideIcon; className: string }> = {
  realtime: { icon: RadioTower, className: "bg-primary-soft text-primary-strong" },
  delayed: { icon: Clock, className: "bg-info-soft text-info" },
  eod: { icon: CalendarCheck, className: "bg-info-soft text-info" },
  demo: { icon: FlaskConical, className: "bg-warning-soft text-warning" },
  cached: { icon: Archive, className: "bg-muted text-foreground" },
  stale: { icon: AlertTriangle, className: "bg-warning-soft text-warning" },
  unavailable: { icon: CircleSlash, className: "bg-destructive-soft text-destructive" },
};

/** Data status of a price. Always icon plus text, never colour alone. */
export function QuoteStatusBadge({
  status,
  className,
}: {
  status: DisplayQuoteStatus;
  className?: string;
}) {
  const { icon: Icon, className: tone } = CONFIG[status];
  return (
    <span
      title={STATUS_DESCRIPTIONS[status]}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
