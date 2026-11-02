import { useSyncExternalStore } from "react";
import { depotStore, type DepotSnapshot } from "@/lib/depot/store";

/** Practice portfolio state. Empty during prerendering and hydration. */
export function useDepot(): DepotSnapshot {
  return useSyncExternalStore(
    depotStore.subscribe,
    depotStore.getSnapshot,
    depotStore.getServerSnapshot,
  );
}
