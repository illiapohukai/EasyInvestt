import { useState } from "react";
import { ExternalLink } from "@/components/common/ExternalLink";
import { ProgramStatusBadge } from "@/components/common/StatusBadge";
import { PROGRAM_STATUS_LABELS, statePrograms, type ProgramStatus } from "@/content/state-programs";
import { cn } from "@/lib/utils";

type Filter = "alle" | ProgramStatus;

const FILTERS: Filter[] = ["alle", "aktiv", "beschlossen", "geplant", "im-wandel"];

function filterLabel(filter: Filter) {
  return filter === "alle" ? "Alle" : PROGRAM_STATUS_LABELS[filter];
}

/** Filterable list of government programmes with status and a source to check. */
export function StateProgramList() {
  const [filter, setFilter] = useState<Filter>("alle");
  const visible =
    filter === "alle" ? statePrograms : statePrograms.filter((item) => item.status === filter);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Nach Status filtern" className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count =
            item === "alle"
              ? statePrograms.length
              : statePrograms.filter((program) => program.status === item).length;
          if (count === 0) return null;
          const active = filter === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card hover:bg-muted",
              )}
            >
              {filterLabel(item)} <span className="font-normal">({count})</span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} {visible.length === 1 ? "Eintrag" : "Einträge"} angezeigt
      </p>

      <ul className="space-y-3">
        {visible.map((program) => (
          <li key={program.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
              <h3 className="text-base font-semibold">{program.name}</h3>
              <ProgramStatusBadge status={program.status} />
            </div>
            <p className="text-sm font-medium text-foreground">{program.statusDetail}</p>
            <p className="text-[0.9375rem] text-foreground/90">{program.description}</p>
            <p className="text-[0.9375rem] text-foreground/90">
              <span className="font-semibold">Für dich: </span>
              {program.relevance}
            </p>
            <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Stand: {program.asOf}</span>
              <span aria-hidden="true">·</span>
              <span>
                Aktuell prüfen:{" "}
                <ExternalLink href={program.check.url} className="font-medium">
                  {program.check.label}
                </ExternalLink>
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
