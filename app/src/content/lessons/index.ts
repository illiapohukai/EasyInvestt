import type { Lesson, LessonId } from "../types";
import { LESSON_IDS } from "../types";
import { grundlagen } from "./grundlagen";
import { zinseszins } from "./zinseszins";
import { anlageklassen } from "./anlageklassen";
import { kleineBetraege } from "./kleine-betraege";
import { altersvorsorge } from "./altersvorsorge";
import { staat } from "./staat";

/** All lessons in learning order. */
export const lessons: readonly Lesson[] = [
  grundlagen,
  zinseszins,
  anlageklassen,
  kleineBetraege,
  altersvorsorge,
  staat,
];

export function isLessonId(value: unknown): value is LessonId {
  return typeof value === "string" && (LESSON_IDS as readonly string[]).includes(value);
}

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

/** 1-based position of a lesson in the learning path. */
export function getLessonNumber(id: LessonId): number {
  return lessons.findIndex((lesson) => lesson.id === id) + 1;
}

export function getNextLesson(id: LessonId): Lesson | undefined {
  const index = lessons.findIndex((lesson) => lesson.id === id);
  return index >= 0 ? lessons[index + 1] : undefined;
}

export const totalLessonMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
