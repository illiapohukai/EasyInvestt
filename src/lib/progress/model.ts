import type { Lesson, LessonId } from "@/content/types";
import { isLessonId } from "@/content/lessons";
import { sanitizeCompoundInput, type CompoundInput } from "@/lib/finance/compound-interest";

export const PROGRESS_STORAGE_KEY = "geldstart.progress";
export const PROGRESS_VERSION = 1;

export interface LessonResult {
  /** ISO timestamp of the first successful quiz completion. */
  completedAt: string;
  /** Number of questions answered correctly on the first attempt. */
  firstTryCorrect: number;
  questionCount: number;
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION;
  completed: Partial<Record<LessonId, LessonResult>>;
  /** Lessons the user has opened at least once, in first-opened order. */
  opened: LessonId[];
  lastLessonId: LessonId | null;
  /** Last calculator inputs, so the calculator reopens with familiar values. */
  calculator: CompoundInput | null;
}

export type LessonStatus = "neu" | "begonnen" | "abgeschlossen";

export const EMPTY_PROGRESS: ProgressState = Object.freeze({
  version: PROGRESS_VERSION,
  completed: Object.freeze({}),
  opened: Object.freeze([]) as unknown as LessonId[],
  lastLessonId: null,
  calculator: null,
}) as ProgressState;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLessonResult(value: unknown): LessonResult | null {
  if (!isRecord(value)) return null;
  const { completedAt, firstTryCorrect, questionCount } = value;
  if (typeof completedAt !== "string" || Number.isNaN(Date.parse(completedAt))) return null;
  const count =
    typeof questionCount === "number" && Number.isInteger(questionCount) && questionCount >= 0
      ? questionCount
      : 0;
  const correct =
    typeof firstTryCorrect === "number" && Number.isInteger(firstTryCorrect) && firstTryCorrect >= 0
      ? Math.min(firstTryCorrect, count)
      : 0;
  return { completedAt, firstTryCorrect: correct, questionCount: count };
}

function parseCalculator(value: unknown): CompoundInput | null {
  if (!isRecord(value)) return null;
  const fields = ["initialAmount", "monthlyContribution", "annualReturnPercent", "years"] as const;
  if (!fields.every((field) => typeof value[field] === "number" && Number.isFinite(value[field]))) {
    return null;
  }
  return sanitizeCompoundInput(value);
}

/**
 * Turns anything read from storage into a valid ProgressState.
 * Unknown or malformed parts are dropped instead of throwing.
 */
export function parseProgress(raw: unknown): ProgressState {
  if (!isRecord(raw) || raw["version"] !== PROGRESS_VERSION) return EMPTY_PROGRESS;

  const completed: Partial<Record<LessonId, LessonResult>> = {};
  if (isRecord(raw["completed"])) {
    for (const [id, result] of Object.entries(raw["completed"])) {
      const parsed = parseLessonResult(result);
      if (isLessonId(id) && parsed) completed[id] = parsed;
    }
  }

  const opened: LessonId[] = [];
  if (Array.isArray(raw["opened"])) {
    for (const id of raw["opened"]) {
      if (isLessonId(id) && !opened.includes(id)) opened.push(id);
    }
  }

  const last = raw["lastLessonId"];
  return {
    version: PROGRESS_VERSION,
    completed,
    opened,
    lastLessonId: isLessonId(last) ? last : null,
    calculator: parseCalculator(raw["calculator"]),
  };
}

export function withLessonOpened(state: ProgressState, id: LessonId): ProgressState {
  if (state.lastLessonId === id && state.opened.includes(id)) return state;
  return {
    ...state,
    opened: state.opened.includes(id) ? state.opened : [...state.opened, id],
    lastLessonId: id,
  };
}

export function withLessonCompleted(
  state: ProgressState,
  id: LessonId,
  result: Omit<LessonResult, "completedAt">,
  now: Date = new Date(),
): ProgressState {
  // The first completion is kept; repeating a quiz does not overwrite it.
  if (state.completed[id]) return withLessonOpened(state, id);
  const opened = withLessonOpened(state, id);
  return {
    ...opened,
    completed: { ...opened.completed, [id]: { ...result, completedAt: now.toISOString() } },
  };
}

export function withCalculator(state: ProgressState, input: CompoundInput): ProgressState {
  return { ...state, calculator: sanitizeCompoundInput(input) };
}

export function hasStoredData(state: ProgressState): boolean {
  return (
    Object.keys(state.completed).length > 0 ||
    state.opened.length > 0 ||
    state.lastLessonId !== null ||
    state.calculator !== null
  );
}

export function getLessonStatus(state: ProgressState, id: LessonId): LessonStatus {
  if (state.completed[id]) return "abgeschlossen";
  if (state.opened.includes(id)) return "begonnen";
  return "neu";
}

export function countCompleted(state: ProgressState, lessons: readonly Lesson[]): number {
  return lessons.filter((lesson) => state.completed[lesson.id]).length;
}

/**
 * Lesson for the "Weiterlernen" action:
 * the last opened lesson if it is not finished yet, otherwise the first
 * unfinished lesson in learning order. Null when everything is completed.
 */
export function getRecommendedLesson(
  state: ProgressState,
  lessons: readonly Lesson[],
): Lesson | null {
  if (state.lastLessonId && !state.completed[state.lastLessonId]) {
    const last = lessons.find((lesson) => lesson.id === state.lastLessonId);
    if (last) return last;
  }
  return lessons.find((lesson) => !state.completed[lesson.id]) ?? null;
}
