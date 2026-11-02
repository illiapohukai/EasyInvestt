import { useState } from "react";
import { PartyPopper, RotateCcw } from "lucide-react";
import type { Lesson } from "@/content/types";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/use-progress";
import { useHydrated } from "@/hooks/use-hydrated";
import { progressStore } from "@/lib/progress/store";
import { QuizQuestionCard, type QuizAnswerResult } from "./QuizQuestionCard";

const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" });

/** Knowledge check at the end of a lesson. Solving all questions completes the lesson. */
export function LessonQuiz({ lesson }: { lesson: Lesson }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState<Record<string, { firstTry: boolean }>>({});

  const total = lesson.quiz.length;
  const solvedCount = Object.keys(solved).length;
  const allSolved = solvedCount === total;
  const firstTryCorrect = Object.values(solved).filter((entry) => entry.firstTry).length;
  const previous = hydrated ? progress.completed[lesson.id] : undefined;

  function handleAnswer(questionId: string, result: QuizAnswerResult) {
    if (!result.correct || solved[questionId]) return;
    const next = { ...solved, [questionId]: { firstTry: result.firstAttempt } };
    setSolved(next);
    if (Object.keys(next).length === total) {
      progressStore.completeLesson(lesson.id, {
        firstTryCorrect: Object.values(next).filter((entry) => entry.firstTry).length,
        questionCount: total,
      });
    }
  }

  function restart() {
    setSolved({});
    setRound((value) => value + 1);
  }

  return (
    <div className="space-y-5">
      {previous && !allSolved && solvedCount === 0 ? (
        <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm">
          Du hast dieses Thema am {dateFormat.format(new Date(previous.completedAt))} abgeschlossen.
          Wiederholen festigt dein Wissen.
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {solvedCount} von {total} {total === 1 ? "Frage" : "Fragen"} gelöst
      </p>

      <ol className="space-y-6">
        {lesson.quiz.map((question, index) => (
          <li
            key={`${round}-${question.id}`}
            className="border-t border-border pt-5 first:border-t-0 first:pt-0"
          >
            <QuizQuestionCard
              question={question}
              label={`Frage ${index + 1} von ${total}`}
              onAnswer={(result) => handleAnswer(question.id, result)}
            />
          </li>
        ))}
      </ol>

      {allSolved ? (
        <div
          role="status"
          className="space-y-3 rounded-xl border border-[#c6e0d6] bg-primary-soft p-4"
        >
          <p className="flex items-center gap-2 text-lg font-bold">
            <PartyPopper aria-hidden="true" className="size-5 text-primary" />
            Thema abgeschlossen
          </p>
          <p>
            Du hast alle Fragen gelöst – {firstTryCorrect} von {total} schon beim ersten Versuch.
            {firstTryCorrect < total
              ? " Fehler gehören zum Lernen dazu: Gerade dabei bleibt am meisten hängen."
              : " Stark!"}
          </p>
          <Button variant="secondary" size="sm" onClick={restart}>
            <RotateCcw />
            Quiz wiederholen
          </Button>
        </div>
      ) : null}
    </div>
  );
}
