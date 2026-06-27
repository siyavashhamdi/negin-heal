import { useEffect } from "react";
import type { AppShellNavContext } from "../layouts/app-shell-nav-items";
import { scheduleAppShellRoutePrefetch } from "../lib/app-shell-route-prefetch";

type UseAppShellRoutePrefetchOptions = AppShellNavContext & {
  readonly authLoading: boolean;
};

/** Prefetches lazy route JS chunks for visible nav items once auth is ready. */
export function useAppShellRoutePrefetch({
  authLoading,
  roles,
  isAuthenticated,
}: UseAppShellRoutePrefetchOptions): void {
  useEffect(() => {
    if (authLoading) {
      return;
    }

    scheduleAppShellRoutePrefetch({
      roles,
      isAuthenticated,
    });
  }, [authLoading, isAuthenticated, roles]);
}
