import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CircleDot,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import { PROGRAM_STATUS_LABELS, type ProgramStatus } from "@/content/state-programs";
import type { LessonStatus } from "@/lib/progress/model";
import { cn } from "@/lib/utils";

const CONFIG: Record<LessonStatus, { label: string; icon: typeof CircleCheck; className: string }> =
  {
    neu: { label: "Neu", icon: CircleDashed, className: "bg-muted text-muted-foreground" },
    begonnen: { label: "Begonnen", icon: CircleDot, className: "bg-info-soft text-info" },
    abgeschlossen: {
      label: "Abgeschlossen",
      icon: CircleCheck,
      className: "bg-primary-soft text-primary-strong",
    },
  };

export function LessonStatusBadge({
  status,
  className,
}: {
  status: LessonStatus;
  className?: string;
}) {
  const { label, icon: Icon, className: tone } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}

const PROGRAM_CONFIG: Record<ProgramStatus, { icon: typeof CircleCheck; className: string }> = {
  aktiv: { icon: CircleCheck, className: "bg-primary-soft text-primary-strong" },
  beschlossen: { icon: FileCheck, className: "bg-info-soft text-info" },
  geplant: { icon: CalendarClock, className: "bg-warning-soft text-warning" },
  "im-wandel": { icon: RefreshCw, className: "bg-muted text-foreground" },
};

/** Status of a government programme. Always shows icon and text, never colour alone. */
export function ProgramStatusBadge({
  status,
  className,
}: {
  status: ProgramStatus;
  className?: string;
}) {
  const { icon: Icon, className: tone } = PROGRAM_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {PROGRAM_STATUS_LABELS[status]}
    </span>
  );
}
