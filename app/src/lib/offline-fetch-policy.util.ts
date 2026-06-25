import type { WatchQueryFetchPolicy } from "@apollo/client";
import { getIsOfflineMode } from "./offline-state";

/** When the API is unreachable, read from Apollo cache instead of the network. */
export function resolveQueryFetchPolicy(
  preferred: WatchQueryFetchPolicy
): WatchQueryFetchPolicy {
  if (!getIsOfflineMode() || preferred === "no-cache" || preferred === "cache-only") {
    return preferred;
  }

  return "cache-only";
}
