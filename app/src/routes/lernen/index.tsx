import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar } from "@/components/common/ProgressBar";
import { LessonListItem } from "@/components/lesson/LessonListItem";
import { lessons, totalLessonMinutes } from "@/content/lessons";
import { SITE } from "@/config/site";
import { useProgress } from "@/hooks/use-progress";
import { countCompleted, getLessonStatus } from "@/lib/progress/model";

export const Route = createFileRoute("/lernen/")({
  head: () => ({ meta: [{ title: `Lernen – ${SITE.name}` }] }),
  component: LearnPage,
});

function LearnPage() {
  const progress = useProgress();
  const completed = countCompleted(progress, lessons);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lernen"
        title="Alle Themen"
        description={`${lessons.length} Themen, zusammen ca. ${totalLessonMinutes} Minuten. Am besten lernst du sie der Reihe nach – du kannst aber überall einsteigen.`}
      />

      <div className="surface space-y-2 p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold">Abgeschlossen</span>
          <span className="tabular-nums">
            {completed} von {lessons.length}
          </span>
        </div>
        <ProgressBar value={completed} max={lessons.length} label="Abgeschlossene Themen" />
        <p className="text-sm text-muted-foreground">
          Ein Thema ist abgeschlossen, wenn du alle Quizfragen richtig beantwortet hast.
        </p>
      </div>

      <ol className="space-y-3">
        {lessons.map((lesson, index) => (
          <li key={lesson.id}>
            <LessonListItem
              lesson={lesson}
              number={index + 1}
              status={getLessonStatus(progress, lesson.id)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
