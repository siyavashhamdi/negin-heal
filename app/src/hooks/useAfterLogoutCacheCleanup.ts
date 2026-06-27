import { useEffect } from "react";
import { subscribeLogoutCacheCleanupEnd } from "../lib/app-shell-nav-prefetch";

/** Runs an effect when logout cache cleanup finishes (e.g. to refetch queries stopped by clearStore). */
export function useAfterLogoutCacheCleanup(effect: () => void): void {
  useEffect(() => subscribeLogoutCacheCleanupEnd(effect), [effect]);
}
