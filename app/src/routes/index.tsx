import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, PartyPopper, Sparkles } from "lucide-react";
import { LessonIcon } from "@/components/common/LessonIcon";
import { DepotStartCard } from "@/components/depot/DepotStartCard";
import { LessonListItem } from "@/components/lesson/LessonListItem";
import { QuizQuestionCard } from "@/components/lesson/QuizQuestionCard";
import { Button } from "@/components/ui/button";
import { getLessonNumber, lessons } from "@/content/lessons";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/hooks/use-progress";
import { getDailyQuestion } from "@/lib/daily";
import { countCompleted, getLessonStatus, getRecommendedLesson } from "@/lib/progress/model";

export const Route = createFileRoute("/")({
  component: StartPage,
});

function ProgressCard() {
  const progress = useProgress();
  const completed = countCompleted(progress, lessons);
  const recommended = getRecommendedLesson(progress, lessons);
  const started = progress.opened.length > 0 || completed > 0;
  const percent = Math.round((completed / lessons.length) * 100);

  return (
    <section
      aria-labelledby="fortschritt-titel"
      className="rounded-2xl bg-primary-strong p-5 text-primary-foreground shadow-sm sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="fortschritt-titel" className="text-sm font-semibold text-white/85">
          Dein Fortschritt
        </h2>
        <p className="text-sm font-semibold tabular-nums">
          {completed} von {lessons.length} Themen
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Abgeschlossene Themen"
        aria-valuemin={0}
        aria-valuemax={lessons.length}
        aria-valuenow={completed}
        aria-valuetext={`${completed} von ${lessons.length} Themen abgeschlossen`}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20"
      >
        <div
          className="h-full rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {recommended ? (
        <div className="mt-5 flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <LessonIcon aria-hidden="true" name={recommended.icon} className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-white/85">
              {started ? "Weiter mit" : "Dein erstes Thema"} · Thema{" "}
              {getLessonNumber(recommended.id)}
            </p>
            <p className="text-xl leading-snug font-bold">{recommended.title}</p>
            <p className="mt-1 text-[0.9375rem] text-white/85">
              {recommended.teaser} · ca. {recommended.minutes} Min.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex items-start gap-3">
          <PartyPopper aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="text-xl font-bold">Alle Themen abgeschlossen!</p>
            <p className="mt-1 text-[0.9375rem] text-white/85">
              Stark. Wiederhole einzelne Quizze oder spiel im Rechner mit eigenen Zahlen.
            </p>
          </div>
        </div>
      )}

      <Button
        asChild
        size="lg"
        className="mt-5 w-full bg-white text-primary-strong hover:bg-primary-soft sm:w-auto"
      >
        {recommended ? (
          <Link to="/lernen/$lessonId" params={{ lessonId: recommended.id }}>
            {started ? "Weiterlernen" : "Loslegen"}
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Link to="/lernen">
            Zum Themenüberblick
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </Button>
    </section>
  );
}

function DailyQuestionCard() {
  const hydrated = useHydrated();
  // The question depends on the local date, so it is only chosen in the browser.
  const daily = hydrated ? getDailyQuestion(lessons, new Date()) : null;

  return (
    <section aria-labelledby="tagesfrage-titel" className="surface space-y-3 p-5">
      <h2 id="tagesfrage-titel" className="flex items-center gap-2 text-lg font-bold">
        <Sparkles aria-hidden="true" className="size-5 text-primary" />
        Frage des Tages
      </h2>
      {daily ? (
        <>
          <QuizQuestionCard key={daily.question.id} question={daily.question} />
          <Link
            to="/lernen/$lessonId"
            params={{ lessonId: daily.lesson.id }}
            className="inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-semibold text-primary underline underline-offset-4"
          >
            Mehr dazu im Thema „{daily.lesson.shortTitle}“
          </Link>
        </>
      ) : (
        <div aria-hidden="true" className="space-y-2">
          <div className="h-5 w-4/5 rounded bg-muted" />
          <div className="h-11 rounded-lg bg-muted" />
          <div className="h-11 rounded-lg bg-muted" />
          <div className="h-11 rounded-lg bg-muted" />
        </div>
      )}
    </section>
  );
}

function StartPage() {
  const progress = useProgress();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-[1.75rem] font-bold sm:text-4xl">
          Geld verstehen – Schritt für Schritt
        </h1>
        <p className="prose-width text-[1.0625rem] text-muted-foreground">
          Sechs kurze Themen, Quizfragen, ein Zinseszins-Rechner und ein Übungsdepot mit virtuellem
          Geld. Ohne Anmeldung – alles bleibt auf deinem Gerät.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <ProgressCard />
          <DepotStartCard />
          <Link
            to="/rechner"
            className="surface group flex items-center gap-4 p-5 transition-colors hover:border-primary/40"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Calculator aria-hidden="true" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Zinseszins-Rechner</span>
              <span className="block text-[0.9375rem] text-muted-foreground">
                Was wird aus 50 € im Monat? Rechne es mit deinen eigenen Zahlen aus.
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <DailyQuestionCard />
        </div>

        <section aria-labelledby="themen-titel" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="themen-titel" className="text-lg font-bold">
              Alle Themen
            </h2>
            <Link
              to="/lernen"
              className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-primary underline underline-offset-4"
            >
              Zur Übersicht
            </Link>
          </div>
          <ol className="space-y-2">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <LessonListItem
                  lesson={lesson}
                  number={index + 1}
                  status={getLessonStatus(progress, lesson.id)}
                  compact
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
