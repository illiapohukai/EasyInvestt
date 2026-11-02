import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CircleCheck, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_NOTE_LENGTH } from "@/lib/depot/types";
import { depotStore } from "@/lib/depot/store";
import { cn } from "@/lib/utils";

export function BackLink({
  to,
  search,
  children,
}: {
  to: "/depot" | "/depot/kaufen" | "/depot/verkaufen";
  search?: Record<string, never>;
  children: string;
}) {
  return (
    <Link
      to={to}
      {...(search ? { search } : {})}
      className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[0.9375rem] font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {children}
    </Link>
  );
}

/** Label/value row for order previews. */
export function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right tabular-nums", strong ? "text-lg font-bold" : "font-semibold")}>
        {children}
      </dd>
    </div>
  );
}

export function NoPortfolioNotice() {
  return (
    <div className="surface space-y-3 p-5">
      <h1 className="text-2xl font-bold">Noch kein Übungsdepot</h1>
      <p className="text-muted-foreground">
        Lege zuerst dein Übungsdepot mit virtuellem Startguthaben an. Das dauert eine Minute.
      </p>
      <Button asChild size="lg">
        <Link to="/depot">Übungsdepot starten</Link>
      </Button>
    </div>
  );
}

/** Success state after a simulated order, with a reflection question. */
export function OrderSuccess({
  title,
  summary,
  question,
  transactionId,
  actions,
}: {
  title: string;
  summary: ReactNode;
  question: string;
  transactionId: string;
  actions: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noteId = useId();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      <section
        aria-labelledby="erfolg-titel"
        className="space-y-3 rounded-xl border border-[#c6e0d6] bg-primary-soft p-5"
      >
        <h1
          id="erfolg-titel"
          ref={headingRef}
          tabIndex={-1}
          className="flex items-center gap-2 text-2xl font-bold outline-none"
        >
          <CircleCheck aria-hidden="true" className="size-6 text-primary" />
          {title}
        </h1>
        <p className="font-semibold">
          Simuliert: Es wurde keine echte Order aufgegeben und kein echtes Geld bewegt.
        </p>
        <div className="text-[0.9375rem]">{summary}</div>
      </section>

      <section aria-labelledby="reflexion-titel" className="surface space-y-3 p-5">
        <h2 id="reflexion-titel" className="flex items-center gap-2 text-lg font-bold">
          <MessageCircleQuestion aria-hidden="true" className="size-5 text-primary" />
          Kurz nachdenken
        </h2>
        <p className="text-[1.0625rem] font-semibold">{question}</p>
        <div className="space-y-1.5">
          <label htmlFor={noteId} className="block text-[0.9375rem]">
            Deine Gedanken (freiwillig, nur auf diesem Gerät gespeichert)
          </label>
          <textarea
            id={noteId}
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            rows={3}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled={note.trim() === ""}
              onClick={() => {
                depotStore.saveNote(transactionId, note);
                setSaved(true);
              }}
            >
              Notiz speichern
            </Button>
            <p role="status" className="text-[0.9375rem] font-medium text-primary-strong">
              {saved ? "Gespeichert – du findest die Notiz bei deinen Transaktionen." : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
    </div>
  );
}
