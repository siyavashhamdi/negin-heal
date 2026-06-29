import {
  PRODUCTS_DELETE_PAGE_ROUTE_REGEX,
  PRODUCTS_EDIT_PAGE_ROUTE_REGEX,
  PRODUCTS_ROUTE_PATH,
} from "../routing/product-route-path";

const PRODUCTS_ROUTE_SEGMENT = PRODUCTS_ROUTE_PATH.slice(1);

/** Routes that are modal overlays — canonical should point to the parent list/detail page. */
const ADMIN_OVERLAY_ROUTE_PATTERN = new RegExp(
  "^/(" +
    `${PRODUCTS_ROUTE_SEGMENT}/(new|edit/[^/]+|delete/[^/]+)` +
    "|more/coupons/(new|edit/[^/]+|delete/[^/]+)" +
    "|more/system-settings/edit/[^/]+" +
    "|users/(new|edit/[^/]+(/confirm)?)" +
    "|payments/(new|[^/]+(/confirm)?)" +
    "|support/tickets/(new|[^/]+)" +
    "|profile/(edit|password))$"
);

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

function isProductsAdminOverlayPath(path: string): boolean {
  return (
    path === `${PRODUCTS_ROUTE_PATH}/new` ||
    PRODUCTS_EDIT_PAGE_ROUTE_REGEX.test(path) ||
    PRODUCTS_DELETE_PAGE_ROUTE_REGEX.test(path)
  );
}

/**
 * Resolves a clean canonical path without query strings or transient overlay segments.
 */
export function resolveCanonicalPath(pathname: string): string {
  let path = normalizePathname(pathname);

  if (/\/(purchase|max)$/.test(path)) {
    path = path.replace(/\/(purchase|max)$/, "");
  }

  if (ADMIN_OVERLAY_ROUTE_PATTERN.test(path)) {
    if (isProductsAdminOverlayPath(path)) {
      return PRODUCTS_ROUTE_PATH;
    }
    if (path.startsWith("/more/coupons/")) {
      return "/more/coupons";
    }
    if (path.startsWith("/more/system-settings/edit/")) {
      return "/more/system-settings";
    }
    if (path.startsWith("/users/")) {
      return "/users";
    }
    if (path.startsWith("/payments/")) {
      return "/payments";
    }
    if (path.startsWith("/support/tickets/")) {
      return "/support/tickets";
    }
    if (path.startsWith("/profile/")) {
      return "/profile";
    }
  }

  return path;
}
