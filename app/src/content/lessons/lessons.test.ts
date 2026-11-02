import { describe, expect, it } from "vitest";
import { assetClasses } from "@/content/asset-classes";
import { statePrograms } from "@/content/state-programs";
import { LESSON_IDS } from "@/content/types";
import { getLesson, getNextLesson, isLessonId, lessons } from "./index";

describe("lesson content", () => {
  it("contains the six lessons in learning order", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual([...LESSON_IDS]);
  });

  it.each(lessons.map((lesson) => [lesson.id, lesson] as const))(
    "%s is complete",
    (_id, lesson) => {
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.intro.length).toBeGreaterThan(20);
      expect(lesson.minutes).toBeGreaterThan(0);
      expect(lesson.sections.length).toBeGreaterThan(0);
      expect(lesson.example.paragraphs.length).toBeGreaterThan(0);
      expect(lesson.takeaways.length).toBeGreaterThan(0);
      expect(lesson.quiz.length).toBeGreaterThanOrEqual(1);
      expect(lesson.quiz.length).toBeLessThanOrEqual(3);

      const sectionIds = lesson.sections.map((section) => section.id);
      expect(new Set(sectionIds).size).toBe(sectionIds.length);

      for (const question of lesson.quiz) {
        const optionIds = question.options.map((option) => option.id);
        expect(new Set(optionIds).size).toBe(optionIds.length);
        expect(optionIds).toContain(question.correctOptionId);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        for (const option of question.options) {
          expect(option.feedback.length, `${question.id}/${option.id}`).toBeGreaterThan(10);
        }
      }
    },
  );

  it("uses unique quiz question ids across all lessons", () => {
    const ids = lessons.flatMap((lesson) => lesson.quiz.map((question) => question.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not recommend products or link to placeholder portfolio sites", () => {
    const text = JSON.stringify([lessons, assetClasses, statePrograms]).toLowerCase();
    expect(text).not.toContain("zukunftsdepot.de");
    expect(text).not.toContain("lovable");
  });

  it("looks up lessons safely", () => {
    expect(getLesson("grundlagen")?.id).toBe("grundlagen");
    expect(getLesson("gibt-es-nicht")).toBeUndefined();
    expect(isLessonId("staat")).toBe(true);
    expect(isLessonId(42)).toBe(false);
    expect(getNextLesson("grundlagen")?.id).toBe("zinseszins");
    expect(getNextLesson("staat")).toBeUndefined();
  });

  it("gives every government programme a status, date and https source", () => {
    for (const program of statePrograms) {
      expect(program.asOf).toMatch(/\d{4}/);
      expect(program.check.url).toMatch(/^https:\/\//);
    }
  });
});
