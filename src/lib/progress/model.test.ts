import { describe, expect, it } from "vitest";
import { lessons } from "@/content/lessons";
import {
  countCompleted,
  EMPTY_PROGRESS,
  getLessonStatus,
  getRecommendedLesson,
  hasStoredData,
  parseProgress,
  PROGRESS_VERSION,
  withCalculator,
  withLessonCompleted,
  withLessonOpened,
} from "./model";

const result = { firstTryCorrect: 2, questionCount: 3 };

describe("parseProgress", () => {
  it.each([
    ["null", null],
    ["a string", "kaputt"],
    ["a number", 42],
    ["an array", [1, 2]],
    ["a wrong version", { version: 99, completed: {} }],
    ["no version", { completed: { grundlagen: {} } }],
  ])("returns empty progress for %s", (_label, raw) => {
    expect(parseProgress(raw)).toEqual(EMPTY_PROGRESS);
  });

  it("keeps valid entries and drops malformed ones", () => {
    const parsed = parseProgress({
      version: PROGRESS_VERSION,
      completed: {
        grundlagen: {
          completedAt: "2026-11-01T10:00:00.000Z",
          firstTryCorrect: 9,
          questionCount: 3,
        },
        zinseszins: { completedAt: "kein Datum" },
        unbekannt: { completedAt: "2026-11-01T10:00:00.000Z" },
        staat: "ja",
      },
      opened: ["grundlagen", "grundlagen", "gibt-es-nicht", 3, "staat"],
      lastLessonId: "gibt-es-nicht",
      calculator: {
        initialAmount: -5,
        monthlyContribution: 50,
        annualReturnPercent: 200,
        years: 10,
      },
    });

    expect(Object.keys(parsed.completed)).toEqual(["grundlagen"]);
    // firstTryCorrect can never exceed the number of questions.
    expect(parsed.completed.grundlagen?.firstTryCorrect).toBe(3);
    expect(parsed.opened).toEqual(["grundlagen", "staat"]);
    expect(parsed.lastLessonId).toBeNull();
    expect(parsed.calculator).toEqual({
      initialAmount: 0,
      monthlyContribution: 50,
      annualReturnPercent: 15,
      years: 10,
    });
  });

  it("drops a calculator entry with missing or non-numeric fields", () => {
    const parsed = parseProgress({
      version: PROGRESS_VERSION,
      calculator: {
        initialAmount: "100",
        monthlyContribution: 50,
        annualReturnPercent: 5,
        years: 10,
      },
    });
    expect(parsed.calculator).toBeNull();
  });
});

describe("state transitions", () => {
  it("tracks opened lessons and the last lesson", () => {
    const state = withLessonOpened(withLessonOpened(EMPTY_PROGRESS, "grundlagen"), "staat");
    expect(state.opened).toEqual(["grundlagen", "staat"]);
    expect(state.lastLessonId).toBe("staat");
    expect(getLessonStatus(state, "grundlagen")).toBe("begonnen");
    expect(getLessonStatus(state, "zinseszins")).toBe("neu");
  });

  it("keeps the first completion when a quiz is repeated", () => {
    const first = withLessonCompleted(
      EMPTY_PROGRESS,
      "grundlagen",
      result,
      new Date("2026-11-01T10:00:00Z"),
    );
    const again = withLessonCompleted(
      first,
      "grundlagen",
      { firstTryCorrect: 0, questionCount: 3 },
      new Date("2026-11-02T10:00:00Z"),
    );
    expect(again.completed.grundlagen).toEqual({
      ...result,
      completedAt: "2026-11-01T10:00:00.000Z",
    });
    expect(getLessonStatus(again, "grundlagen")).toBe("abgeschlossen");
    expect(countCompleted(again, lessons)).toBe(1);
  });

  it("does not mutate the frozen empty state", () => {
    withLessonCompleted(EMPTY_PROGRESS, "grundlagen", result);
    expect(EMPTY_PROGRESS.completed).toEqual({});
    expect(EMPTY_PROGRESS.opened).toEqual([]);
  });

  it("stores sanitized calculator values", () => {
    const state = withCalculator(EMPTY_PROGRESS, {
      initialAmount: 100,
      monthlyContribution: 25,
      annualReturnPercent: 5,
      years: 61,
    });
    expect(state.calculator?.years).toBe(60);
    expect(hasStoredData(state)).toBe(true);
    expect(hasStoredData(EMPTY_PROGRESS)).toBe(false);
  });
});

describe("getRecommendedLesson", () => {
  it("starts with the first lesson", () => {
    expect(getRecommendedLesson(EMPTY_PROGRESS, lessons)?.id).toBe("grundlagen");
  });

  it("continues with the last unfinished lesson", () => {
    const state = withLessonOpened(EMPTY_PROGRESS, "altersvorsorge");
    expect(getRecommendedLesson(state, lessons)?.id).toBe("altersvorsorge");
  });

  it("moves on to the first unfinished lesson after completing the last one", () => {
    let state = withLessonCompleted(EMPTY_PROGRESS, "grundlagen", result);
    expect(getRecommendedLesson(state, lessons)?.id).toBe("zinseszins");
    state = withLessonCompleted(state, "zinseszins", result);
    expect(getRecommendedLesson(state, lessons)?.id).toBe("anlageklassen");
  });

  it("returns null when everything is completed", () => {
    const state = lessons.reduce(
      (acc, lesson) => withLessonCompleted(acc, lesson.id, result),
      EMPTY_PROGRESS,
    );
    expect(getRecommendedLesson(state, lessons)).toBeNull();
    expect(countCompleted(state, lessons)).toBe(lessons.length);
  });
});
