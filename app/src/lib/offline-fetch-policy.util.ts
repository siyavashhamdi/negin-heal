import type { WatchQueryFetchPolicy } from "@apollo/client";
import { getIsBrowserOffline, getIsOfflineMode } from "./offline-state";

/** When the API is unreachable, serve cache first but still try the network so we can recover. */
export function resolveQueryFetchPolicy(preferred: WatchQueryFetchPolicy): WatchQueryFetchPolicy {
  if (!getIsOfflineMode() || preferred === "no-cache" || preferred === "cache-only") {
    return preferred;
  }

  if (getIsBrowserOffline()) {
    return "cache-only";
  }

  return preferred;
}
