import type { LessonId } from "@/content/types";
import type { CompoundInput } from "@/lib/finance/compound-interest";
import {
  EMPTY_PROGRESS,
  PROGRESS_STORAGE_KEY,
  parseProgress,
  withCalculator,
  withLessonCompleted,
  withLessonOpened,
  type LessonResult,
  type ProgressState,
} from "./model";
import { readJson, removeKey, writeJson } from "./storage";

/**
 * Small external store for learning progress, persisted in localStorage.
 * Designed for React's useSyncExternalStore: the server/prerender snapshot is
 * always EMPTY_PROGRESS, the client snapshot is loaded lazily from storage.
 */

type Listener = () => void;

let state: ProgressState | null = null;
let persisted = true;
const listeners = new Set<Listener>();

function load(): ProgressState {
  state = parseProgress(readJson(PROGRESS_STORAGE_KEY));
  return state;
}

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: ProgressState) {
  if (next === state) return;
  state = next;
  persisted = writeJson(PROGRESS_STORAGE_KEY, next);
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key === null || event.key === PROGRESS_STORAGE_KEY) {
    load();
    emit();
  }
}

export const progressStore = {
  getSnapshot(): ProgressState {
    return state ?? load();
  },

  getServerSnapshot(): ProgressState {
    return EMPTY_PROGRESS;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    if (listeners.size === 1 && typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  },

  /** False when the last write failed, e.g. because storage is disabled. */
  isPersisted(): boolean {
    return persisted;
  },

  openLesson(id: LessonId) {
    setState(withLessonOpened(progressStore.getSnapshot(), id));
  },

  completeLesson(id: LessonId, result: Omit<LessonResult, "completedAt">) {
    setState(withLessonCompleted(progressStore.getSnapshot(), id, result));
  },

  saveCalculator(input: CompoundInput) {
    setState(withCalculator(progressStore.getSnapshot(), input));
  },

  reset() {
    state = EMPTY_PROGRESS;
    persisted = removeKey(PROGRESS_STORAGE_KEY);
    emit();
  },
};

/** Test helper: forget the cached state so the next read comes from storage. */
export function __resetProgressStoreForTests() {
  state = null;
  persisted = true;
  listeners.clear();
  if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
}
