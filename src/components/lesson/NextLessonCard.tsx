import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator } from "lucide-react";
import type { Lesson } from "@/content/types";
import { Button } from "@/components/ui/button";
import { getLessonNumber } from "@/content/lessons";

export function NextLessonCard({ next }: { next: Lesson | undefined }) {
  if (!next) {
    return (
      <section aria-labelledby="weiter-titel" className="surface space-y-3 p-5">
        <h2 id="weiter-titel" className="text-xl font-bold">
          Das war das letzte Thema
        </h2>
        <p className="text-muted-foreground">
          Im Überblick siehst du, welche Themen du schon abgeschlossen hast. Im Rechner kannst du
          weiter ausprobieren, wie Zeit und Beträge zusammenwirken.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link to="/lernen">Zum Themenüberblick</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/rechner">
              <Calculator />
              Rechner öffnen
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="weiter-titel" className="surface p-5">
      <p className="text-sm font-semibold text-primary">Nächstes Thema</p>
      <h2 id="weiter-titel" className="mt-1 text-xl font-bold">
        {getLessonNumber(next.id)}. {next.title}
      </h2>
      <p className="mt-1 text-muted-foreground">{next.teaser}</p>
      <Button asChild className="mt-4 w-full sm:w-auto">
        <Link to="/lernen/$lessonId" params={{ lessonId: next.id }}>
          Weiterlernen
          <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}
