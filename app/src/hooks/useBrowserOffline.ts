import { useSyncExternalStore } from "react";
import { getIsOfflineMode, subscribeOfflineModeStatus } from "../lib/offline-state";

export function useBrowserOffline(): boolean {
  return useSyncExternalStore(subscribeOfflineModeStatus, getIsOfflineMode, () => false);
}
