import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Clock } from "lucide-react";
import type { Lesson } from "@/content/types";
import type { LessonStatus } from "@/lib/progress/model";
import { LessonStatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

interface LessonListItemProps {
  lesson: Lesson;
  number: number;
  status: LessonStatus;
  compact?: boolean;
}

export function LessonListItem({ lesson, number, status, compact = false }: LessonListItemProps) {
  const done = status === "abgeschlossen";
  return (
    <Link
      to="/lernen/$lessonId"
      params={{ lessonId: lesson.id }}
      className={cn(
        "surface group flex items-center gap-3 transition-colors hover:border-primary/40",
        compact ? "p-3" : "p-4",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          done ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary-strong",
        )}
      >
        {done ? <Check className="size-5" /> : number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">
            <span className="sr-only">Thema {number}: </span>
            {compact ? lesson.shortTitle : lesson.title}
          </span>
          <LessonStatusBadge status={status} />
        </span>
        {compact ? null : (
          <span className="mt-0.5 block text-[0.9375rem] text-muted-foreground">
            {lesson.teaser}
          </span>
        )}
        <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <Clock aria-hidden="true" className="size-3.5" />
          ca. {lesson.minutes} Min.
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
