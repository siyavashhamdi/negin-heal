import { useSyncExternalStore } from "react";
import {
  getGeneralUpdatesOnline,
  subscribeGeneralUpdatesOnline,
} from "../lib/general-updates-listeners";

export function useGeneralUpdatesOnline(): boolean | undefined {
  const value = useSyncExternalStore(
    subscribeGeneralUpdatesOnline,
    getGeneralUpdatesOnline,
    () => null
  );

  return value === null ? undefined : value;
}
