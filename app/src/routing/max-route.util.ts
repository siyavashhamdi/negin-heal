import { clearMaxRouteOwner, setMaxRouteOwner } from "./max-route-owner.store";
import { clearCompressMediaRouteOwner } from "./compress-media-route-owner.store";

export function isMaxRoutePathname(pathname: string): boolean {
  return /\/max$/.test(pathname);
}

/** Base pathname without overlay segments (/max, /purchase, /compress-media). */
export function stripOverlayRoutePathname(pathname: string): string {
  return pathname
    .replace(/\/compress-media$/, "")
    .replace(/\/max$/, "")
    .replace(/\/purchase$/, "");
}

export function buildMaxRoutePathname(pathname: string): string {
  return `${stripOverlayRoutePathname(pathname)}/max`;
}

export function buildMaxRouteLocation(
  pathname: string,
  searchParams: URLSearchParams
): { pathname: string; search: string } {
  const search = searchParams.toString();

  return {
    pathname: buildMaxRoutePathname(pathname),
    search: search ? `?${search}` : "",
  };
}

export function buildCloseMaxRouteLocation(
  pathname: string,
  searchParams: URLSearchParams
): { pathname: string; search: string } {
  const search = searchParams.toString();

  return {
    pathname: stripOverlayRoutePathname(pathname),
    search: search ? `?${search}` : "",
  };
}

export function openMaxRoute(
  ownerId: string,
  pathname: string,
  searchParams: URLSearchParams,
  navigate: (to: { pathname: string; search: string }) => void
): void {
  clearCompressMediaRouteOwner();
  setMaxRouteOwner(ownerId);
  navigate(buildMaxRouteLocation(pathname, searchParams));
}

export function closeMaxRoute(
  ownerId: string,
  pathname: string,
  searchParams: URLSearchParams,
  navigate: (to: { pathname: string; search: string }) => void
): void {
  clearMaxRouteOwner(ownerId);

  if (!isMaxRoutePathname(pathname)) {
    return;
  }

  navigate(buildCloseMaxRouteLocation(pathname, searchParams));
}
