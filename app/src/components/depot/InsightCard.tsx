import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { Insight } from "@/lib/depot/analysis";
import { cn } from "@/lib/utils";

const TONE = {
  warning: { icon: AlertTriangle, className: "text-warning" },
  info: { icon: Info, className: "text-info" },
  neutral: { icon: Lightbulb, className: "text-primary" },
} as const;

/** The most relevant deterministic observation, plus all others on request. */
export function InsightCard({ insights }: { insights: Insight[] }) {
  const [first, ...rest] = insights;
  if (!first) return null;
  const { icon: Icon, className } = TONE[first.tone];
  return (
    <section aria-labelledby="einblick-titel" className="surface space-y-3 p-4 sm:p-5">
      <h2 id="einblick-titel" className="flex items-center gap-2 text-lg font-bold">
        <Lightbulb aria-hidden="true" className="size-5 text-primary" />
        Einblick in dein Depot
      </h2>
      <p className="flex gap-2.5 text-[0.9375rem]">
        <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", className)} />
        <span>{first.text}</span>
      </p>
      {rest.length > 0 ? (
        <details className="rounded-lg border border-border">
          <summary className="flex min-h-11 items-center px-3 text-[0.9375rem] font-semibold">
            Depot analysieren: {rest.length} weitere{" "}
            {rest.length === 1 ? "Beobachtung" : "Beobachtungen"}
          </summary>
          <ul className="space-y-2 border-t border-border p-3 text-[0.9375rem]">
            {rest.map((insight) => {
              const tone = TONE[insight.tone];
              return (
                <li key={insight.id} className="flex gap-2.5">
                  <tone.icon
                    aria-hidden="true"
                    className={cn("mt-0.5 size-4 shrink-0", tone.className)}
                  />
                  <span>{insight.text}</span>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Berechnet aus deinen Positionen und Kursen. Keine Empfehlung zum Kaufen oder Verkaufen.
      </p>
    </section>
  );
}
