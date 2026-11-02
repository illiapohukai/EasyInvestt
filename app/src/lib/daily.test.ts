import { describe, expect, it } from "vitest";
import { lessons } from "@/content/lessons";
import { getDailyQuestion, localDayNumber } from "./daily";

describe("getDailyQuestion", () => {
  it("is stable within a day and changes on the next day", () => {
    const morning = getDailyQuestion(lessons, new Date(2026, 10, 2, 7, 0));
    const evening = getDailyQuestion(lessons, new Date(2026, 10, 2, 23, 30));
    const tomorrow = getDailyQuestion(lessons, new Date(2026, 10, 3, 7, 0));
    expect(morning?.question.id).toBe(evening?.question.id);
    expect(tomorrow?.question.id).not.toBe(morning?.question.id);
  });

  it("returns a question that belongs to its lesson", () => {
    const daily = getDailyQuestion(lessons, new Date(2026, 0, 1));
    expect(daily?.lesson.quiz).toContain(daily?.question);
  });

  it("returns null without questions", () => {
    expect(getDailyQuestion([], new Date())).toBeNull();
  });

  it("counts calendar days", () => {
    expect(localDayNumber(new Date(1970, 0, 2, 12))).toBe(1);
  });
});
