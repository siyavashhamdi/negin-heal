import {
  APP_SHELL_NAV_ITEMS,
  filterAppShellNavItems,
  resolveAppShellNavPath,
  type AppShellNavContext,
  type AppShellNavItemDefinition,
  type AppShellNavItemId,
} from "../layouts/app-shell-nav-items";
import {
  importProductsIndex,
  importMoreIndex,
  importNotificationsIndex,
  importPaymentsIndex,
  importProfileIndex,
  importSupportIndex,
  importSupportTicketsIndex,
} from "../routing/lazy-route-imports";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";

type RouteLoader = () => Promise<unknown>;

const NAV_ITEM_LOADERS: Record<AppShellNavItemId, RouteLoader> = {
  products: importProductsIndex,
  payments: importPaymentsIndex,
  notifications: importNotificationsIndex,
  support: importSupportIndex,
  profile: importProfileIndex,
  more: importMoreIndex,
};

const prefetchedRouteKeys = new Set<string>();
let pendingRoutePrefetchHandle: number | null = null;
let pendingRoutePrefetchUsesIdleCallback = false;

function resolveRouteLoader(
  item: AppShellNavItemDefinition,
  context: AppShellNavContext
): RouteLoader {
  if (item.id === "support") {
    const path = resolveAppShellNavPath(item, context);
    if (path === APP_SHELL_ROUTES.supportTickets) {
      return importSupportTicketsIndex;
    }
  }

  return NAV_ITEM_LOADERS[item.id];
}

function buildRoutePrefetchKey(
  item: AppShellNavItemDefinition,
  context: AppShellNavContext
): string {
  if (item.id === "support") {
    return resolveAppShellNavPath(item, context);
  }

  return item.id;
}

/** Downloads the JS chunk for a nav target ahead of navigation. */
export function prefetchAppShellNavRoute(
  item: AppShellNavItemDefinition,
  context: AppShellNavContext
): void {
  const key = buildRoutePrefetchKey(item, context);
  if (prefetchedRouteKeys.has(key)) {
    return;
  }

  prefetchedRouteKeys.add(key);
  void resolveRouteLoader(item, context)().catch(() => {
    prefetchedRouteKeys.delete(key);
  });
}

/** Warms route chunks for visible nav items after the shell is ready. */
export function scheduleAppShellRoutePrefetch(context: AppShellNavContext): void {
  if (typeof window === "undefined") {
    return;
  }

  const productsItem = APP_SHELL_NAV_ITEMS.find((item) => item.id === "products");
  if (productsItem) {
    prefetchAppShellNavRoute(productsItem, context);
  }

  const visibleItems = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
  const remainingItems = visibleItems.filter((item) => item.id !== "products");
  if (remainingItems.length === 0) {
    return;
  }

  if (pendingRoutePrefetchHandle !== null) {
    if (pendingRoutePrefetchUsesIdleCallback && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(pendingRoutePrefetchHandle);
    } else {
      window.clearTimeout(pendingRoutePrefetchHandle);
    }
  }

  const run = (): void => {
    pendingRoutePrefetchHandle = null;
    pendingRoutePrefetchUsesIdleCallback = false;

    for (const item of remainingItems) {
      prefetchAppShellNavRoute(item, context);
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    pendingRoutePrefetchUsesIdleCallback = true;
    pendingRoutePrefetchHandle = window.requestIdleCallback(run, { timeout: 2_000 });
    return;
  }

  pendingRoutePrefetchUsesIdleCallback = false;
  pendingRoutePrefetchHandle = window.setTimeout(run, 150);
}
