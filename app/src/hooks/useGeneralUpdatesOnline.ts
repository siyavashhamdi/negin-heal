import { useSyncExternalStore } from "react";
import {
  getGeneralUpdatesOnline,
  subscribeGeneralUpdatesOnline,
} from "../lib/general-updates-listeners";

export function useGeneralUpdatesOnline(): boolean {
  return useSyncExternalStore(
    subscribeGeneralUpdatesOnline,
    getGeneralUpdatesOnline,
    () => false
  );
}
