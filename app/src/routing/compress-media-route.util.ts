import { clearMaxRouteOwner } from "./max-route-owner.store";
import {
  clearCompressMediaRouteOwner,
  setCompressMediaRouteOwner,
} from "./compress-media-route-owner.store";
import { stripOverlayRoutePathname } from "./max-route.util";

export const COMPRESS_MEDIA_ROUTE_SUFFIX = "/compress-media";

export function isCompressMediaRoutePathname(pathname: string): boolean {
  return pathname.endsWith(COMPRESS_MEDIA_ROUTE_SUFFIX);
}

export function buildCompressMediaRoutePathname(pathname: string): string {
  return `${stripOverlayRoutePathname(pathname)}${COMPRESS_MEDIA_ROUTE_SUFFIX}`;
}

export function buildCompressMediaRouteLocation(
  pathname: string,
  searchParams: URLSearchParams
): { pathname: string; search: string } {
  const search = searchParams.toString();

  return {
    pathname: buildCompressMediaRoutePathname(pathname),
    search: search ? `?${search}` : "",
  };
}

export function buildCloseCompressMediaRouteLocation(
  pathname: string,
  searchParams: URLSearchParams
): { pathname: string; search: string } {
  const search = searchParams.toString();

  return {
    pathname: stripOverlayRoutePathname(pathname),
    search: search ? `?${search}` : "",
  };
}

export function openCompressMediaRoute(
  ownerId: string,
  pathname: string,
  searchParams: URLSearchParams,
  navigate: (to: { pathname: string; search: string }) => void
): void {
  clearMaxRouteOwner();
  setCompressMediaRouteOwner(ownerId);
  navigate(buildCompressMediaRouteLocation(pathname, searchParams));
}

export function closeCompressMediaRoute(
  ownerId: string,
  pathname: string,
  searchParams: URLSearchParams,
  navigate: (to: { pathname: string; search: string }) => void
): void {
  clearCompressMediaRouteOwner(ownerId);

  if (!isCompressMediaRoutePathname(pathname)) {
    return;
  }

  navigate(buildCloseCompressMediaRouteLocation(pathname, searchParams));
}
