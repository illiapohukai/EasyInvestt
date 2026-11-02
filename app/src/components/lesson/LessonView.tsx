import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookmarkCheck, CircleHelp, Clock, FlaskConical, Lightbulb } from "lucide-react";
import type { Lesson, LessonSection } from "@/content/types";
import { getLessonNumber, getNextLesson, lessons } from "@/content/lessons";
import { LessonIcon } from "@/components/common/LessonIcon";
import { LessonStatusBadge } from "@/components/common/StatusBadge";
import { RichText } from "@/components/common/RichText";
import { useProgress } from "@/hooks/use-progress";
import { getLessonStatus } from "@/lib/progress/model";
import { progressStore } from "@/lib/progress/store";
import { LessonInteractive } from "./interactive";
import { LessonDepotLink } from "./LessonDepotLink";
import { LessonQuiz } from "./LessonQuiz";
import { NextLessonCard } from "./NextLessonCard";

function SectionLabel({ icon: Icon, children }: { icon: typeof Lightbulb; children: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </p>
  );
}

function ContentSection({ section }: { section: LessonSection }) {
  const headingId = `abschnitt-${section.id}`;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-xl font-bold sm:text-[1.375rem]">
        {section.heading}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-foreground/90">
          <RichText text={paragraph} />
        </p>
      ))}
      {section.bullets ? (
        <ul className="list-disc space-y-1 pl-5 text-foreground/90">
          {section.bullets.map((bullet) => (
            <li key={bullet}>
              <RichText text={bullet} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.terms ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          {section.terms.map(({ term, definition }) => (
            <div key={term} className="rounded-lg border border-border bg-card p-3">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-[0.9375rem] text-muted-foreground">{definition}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

export function LessonView({ lesson }: { lesson: Lesson }) {
  const progress = useProgress();
  const number = getLessonNumber(lesson.id);
  const next = getNextLesson(lesson.id);
  const status = getLessonStatus(progress, lesson.id);

  useEffect(() => {
    progressStore.openLesson(lesson.id);
  }, [lesson.id]);

  return (
    <article className="mx-auto max-w-2xl">
      <Link
        to="/lernen"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[0.9375rem] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Alle Themen
      </Link>

      <header className="mt-3 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <LessonIcon name={lesson.icon} className="size-6" />
          </span>
          <p className="text-sm font-semibold text-muted-foreground">
            Thema {number} von {lessons.length}
          </p>
        </div>
        <h1 className="text-[1.875rem] font-bold sm:text-4xl">{lesson.title}</h1>
        <p className="text-[1.0625rem] text-muted-foreground">{lesson.intro}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            ca. {lesson.minutes} Min.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleHelp aria-hidden="true" className="size-4" />
            {lesson.quiz.length} Quizfragen
          </span>
          <LessonStatusBadge status={status} />
        </div>
        <a
          href="#wissen-pruefen"
          className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-primary underline underline-offset-4"
        >
          Direkt zum Quiz
        </a>
      </header>

      <div className="mt-8 space-y-8">
        {lesson.sections.map((section) => (
          <ContentSection key={section.id} section={section} />
        ))}

        <section aria-labelledby="beispiel-titel" className="surface space-y-3 p-4 sm:p-5">
          <SectionLabel icon={Lightbulb}>Beispiel</SectionLabel>
          <h2 id="beispiel-titel" className="text-xl font-bold">
            {lesson.example.title}
          </h2>
          {lesson.example.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-foreground/90">
              <RichText text={paragraph} />
            </p>
          ))}
        </section>

        <section aria-labelledby="ausprobieren-titel" className="surface space-y-4 p-4 sm:p-5">
          <div className="space-y-1">
            <SectionLabel icon={FlaskConical}>Ausprobieren</SectionLabel>
            <h2 id="ausprobieren-titel" className="text-xl font-bold">
              {lesson.interactive.title}
            </h2>
            <p className="text-muted-foreground">{lesson.interactive.description}</p>
          </div>
          <LessonInteractive kind={lesson.interactive.kind} />
        </section>

        <LessonDepotLink lessonId={lesson.id} />

        <section
          aria-labelledby="merke-titel"
          className="space-y-3 rounded-xl border border-[#c6e0d6] bg-primary-soft p-4 sm:p-5"
        >
          <h2 id="merke-titel" className="flex items-center gap-2 text-xl font-bold">
            <BookmarkCheck aria-hidden="true" className="size-5 text-primary" />
            Merke
          </h2>
          <ul className="space-y-2">
            {lesson.takeaways.map((takeaway) => (
              <li key={takeaway} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="wissen-pruefen"
          aria-labelledby="quiz-titel"
          className="surface scroll-mt-20 space-y-4 p-4 sm:p-5"
        >
          <div className="space-y-1">
            <SectionLabel icon={CircleHelp}>Wissen prüfen</SectionLabel>
            <h2 id="quiz-titel" className="text-xl font-bold">
              Kurzes Quiz
            </h2>
            <p className="text-muted-foreground">
              Wähle eine Antwort – du bekommst sofort eine Erklärung. Wenn du alle Fragen gelöst
              hast, ist das Thema abgeschlossen.
            </p>
          </div>
          <LessonQuiz lesson={lesson} />
        </section>

        <NextLessonCard next={next} />
      </div>
    </article>
  );
}
