import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_COMPOUND_INPUT } from "@/lib/finance/compound-interest";
import { EMPTY_PROGRESS, PROGRESS_STORAGE_KEY } from "./model";
import { isStorageWritable, readJson } from "./storage";
import { __resetProgressStoreForTests, progressStore } from "./store";

beforeEach(() => {
  window.localStorage.clear();
  __resetProgressStoreForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("progressStore", () => {
  it("persists opened and completed lessons", () => {
    progressStore.openLesson("zinseszins");
    progressStore.completeLesson("zinseszins", { firstTryCorrect: 3, questionCount: 3 });

    const stored = readJson(PROGRESS_STORAGE_KEY) as Record<string, unknown>;
    expect(stored["lastLessonId"]).toBe("zinseszins");
    expect(Object.keys(stored["completed"] as object)).toEqual(["zinseszins"]);

    // A fresh store (e.g. after a reload) reads the same data back.
    __resetProgressStoreForTests();
    expect(progressStore.getSnapshot().completed.zinseszins?.firstTryCorrect).toBe(3);
  });

  it("persists calculator values", () => {
    progressStore.saveCalculator({ ...DEFAULT_COMPOUND_INPUT, monthlyContribution: 75 });
    __resetProgressStoreForTests();
    expect(progressStore.getSnapshot().calculator?.monthlyContribution).toBe(75);
  });

  it("recovers from malformed JSON", () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "{kaputt");
    expect(progressStore.getSnapshot()).toEqual(EMPTY_PROGRESS);
    progressStore.openLesson("grundlagen");
    expect(progressStore.getSnapshot().opened).toEqual(["grundlagen"]);
  });

  it("reset removes everything and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = progressStore.subscribe(listener);
    progressStore.openLesson("grundlagen");
    progressStore.saveCalculator(DEFAULT_COMPOUND_INPUT);
    progressStore.reset();

    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    expect(progressStore.getSnapshot()).toEqual(EMPTY_PROGRESS);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it("keeps working in memory when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });

    expect(() => progressStore.openLesson("staat")).not.toThrow();
    expect(progressStore.getSnapshot().lastLessonId).toBe("staat");
    expect(progressStore.isPersisted()).toBe(false);
    expect(isStorageWritable()).toBe(false);
  });

  it("returns empty progress as server snapshot", () => {
    progressStore.openLesson("grundlagen");
    expect(progressStore.getServerSnapshot()).toEqual(EMPTY_PROGRESS);
  });
});
