import { useEffect } from "react";
import {
  scheduleAppShellNavPrefetch,
  type AppShellNavPrefetchContext,
} from "../lib/app-shell-nav-prefetch";

type UseAppShellNavPrefetchOptions = AppShellNavPrefetchContext & {
  readonly authLoading: boolean;
};

/**
 * Warms Apollo cache for visible bottom-nav pages once per auth snapshot
 * (initial load or login), deferred to idle time.
 */
export function useAppShellNavPrefetch({
  authLoading,
  roles,
  isAuthenticated,
  userId,
  isEndUser,
}: UseAppShellNavPrefetchOptions): void {
  useEffect(() => {
    if (authLoading) {
      return;
    }

    scheduleAppShellNavPrefetch({
      roles,
      isAuthenticated,
      userId,
      isEndUser,
    });
  }, [authLoading, isAuthenticated, isEndUser, roles, userId]);
}
