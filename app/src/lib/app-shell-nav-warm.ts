import type { AppShellNavContext, AppShellNavItemDefinition } from "../layouts/app-shell-nav-items";
import {
  prefetchAppShellNavItemData,
  type AppShellNavPrefetchContext,
} from "./app-shell-nav-prefetch";
import { prefetchAppShellNavRoute } from "./app-shell-route-prefetch";

/** Preloads route chunk and list data for a nav item ahead of navigation. */
export function warmAppShellNavTarget(
  item: AppShellNavItemDefinition,
  routeContext: AppShellNavContext,
  dataContext: AppShellNavPrefetchContext
): void {
  prefetchAppShellNavRoute(item, routeContext);
  prefetchAppShellNavItemData(item, dataContext);
}
