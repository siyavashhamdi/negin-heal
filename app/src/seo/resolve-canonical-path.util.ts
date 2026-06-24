/** Routes that are modal overlays — canonical should point to the parent list/detail page. */
const ADMIN_OVERLAY_ROUTE_PATTERN = new RegExp(
  "^/(courses/(new|edit/[^/]+|delete/[^/]+)" +
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

/**
 * Resolves a clean canonical path without query strings or transient overlay segments.
 */
export function resolveCanonicalPath(pathname: string): string {
  let path = normalizePathname(pathname);

  if (/\/(purchase|max)$/.test(path)) {
    path = path.replace(/\/(purchase|max)$/, "");
  }

  if (ADMIN_OVERLAY_ROUTE_PATTERN.test(path)) {
    if (path.startsWith("/courses/")) {
      return "/courses";
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
