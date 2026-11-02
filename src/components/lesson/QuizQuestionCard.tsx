import { useId, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import type { QuizQuestion } from "@/content/types";
import { cn } from "@/lib/utils";

export interface QuizAnswerResult {
  correct: boolean;
  /** True if this was the first answer given for the question. */
  firstAttempt: boolean;
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  /** Shown before the prompt, e.g. "Frage 1 von 3". */
  label?: string;
  onAnswer?: (result: QuizAnswerResult) => void;
  className?: string;
}

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * One multiple-choice question with immediate, explanatory feedback.
 * Wrong answers can be retried; once the right answer is found the question is solved.
 */
export function QuizQuestionCard({ question, label, onAnswer, className }: QuizQuestionCardProps) {
  const id = useId();
  const promptId = `${id}-prompt`;
  const feedbackId = `${id}-feedback`;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triedIds, setTriedIds] = useState<string[]>([]);

  const solved = selectedId === question.correctOptionId;
  const selected = question.options.find((option) => option.id === selectedId);

  function choose(optionId: string) {
    if (solved) return;
    const firstAttempt = triedIds.length === 0;
    setSelectedId(optionId);
    setTriedIds((ids) => (ids.includes(optionId) ? ids : [...ids, optionId]));
    onAnswer?.({ correct: optionId === question.correctOptionId, firstAttempt });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div id={promptId}>
        {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
        <p className="text-[1.0625rem] font-semibold leading-snug">{question.prompt}</p>
      </div>

      <ul role="group" aria-labelledby={promptId} className="space-y-2">
        {question.options.map((option, index) => {
          const isCorrect = option.id === question.correctOptionId;
          const wasTriedWrong = !isCorrect && triedIds.includes(option.id);
          const showCorrect = solved && isCorrect;
          const locked = solved && !isCorrect;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => choose(option.id)}
                aria-disabled={locked || undefined}
                aria-describedby={selectedId === option.id ? feedbackId : undefined}
                className={cn(
                  "flex min-h-12 w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  "border-input bg-card hover:border-primary/50 hover:bg-muted/60",
                  wasTriedWrong &&
                    "border-destructive/40 bg-destructive-soft hover:bg-destructive-soft",
                  showCorrect && "border-primary bg-primary-soft hover:bg-primary-soft",
                  locked && !wasTriedWrong && "opacity-70",
                  locked && "cursor-default hover:border-input",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    showCorrect
                      ? "border-primary bg-primary text-primary-foreground"
                      : wasTriedWrong
                        ? "border-destructive bg-destructive text-destructive-foreground"
                        : "border-input text-muted-foreground",
                  )}
                >
                  {showCorrect ? (
                    <CircleCheck className="size-4" />
                  ) : wasTriedWrong ? (
                    <CircleX className="size-4" />
                  ) : (
                    LETTERS[index]
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {option.text}
                  {showCorrect ? <span className="sr-only"> – richtige Antwort</span> : null}
                  {wasTriedWrong ? <span className="sr-only"> – nicht richtig</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div id={feedbackId} role="status" aria-live="polite">
        {selected ? (
          <div
            className={cn(
              "flex gap-2.5 rounded-lg p-3 text-[0.9375rem]",
              solved ? "bg-primary-soft" : "bg-warning-soft",
            )}
          >
            {solved ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            ) : (
              <CircleX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            )}
            <p>
              <strong className="block font-semibold">
                {solved ? "Richtig!" : "Noch nicht ganz."}
              </strong>
              {selected.feedback}
              {solved ? null : " Versuch es gern noch einmal."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
