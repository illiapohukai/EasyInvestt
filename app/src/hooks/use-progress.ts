import { useSyncExternalStore } from "react";
import { progressStore } from "@/lib/progress/store";
import type { ProgressState } from "@/lib/progress/model";

/** Current learning progress. Renders the empty state during prerendering and hydration. */
export function useProgress(): ProgressState {
  return useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );
}
