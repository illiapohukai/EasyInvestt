import type { Lesson, QuizQuestion } from "@/content/types";

export interface DailyQuestion {
  lesson: Lesson;
  question: QuizQuestion;
}

/** Number of whole days since 1970-01-01 for the local calendar date. */
export function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/**
 * Picks one quiz question per calendar day, rotating through all lessons.
 * Deterministic, so the question stays the same for the whole day.
 */
export function getDailyQuestion(lessons: readonly Lesson[], date: Date): DailyQuestion | null {
  const all = lessons.flatMap((lesson) => lesson.quiz.map((question) => ({ lesson, question })));
  if (all.length === 0) return null;
  const index = ((localDayNumber(date) % all.length) + all.length) % all.length;
  return all[index] ?? null;
}
