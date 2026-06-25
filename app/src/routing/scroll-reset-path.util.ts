/**
 * Pathname key used for window scroll reset. Overlay routes that keep the same
 * underlying page (purchase dialog, media viewer, etc.) are normalized away.
 */
export function getPathnameForScrollReset(pathname: string): string {
  return pathname
    .replace(/\/purchase$/, "")
    .replace(/\/compress-media$/, "")
    .replace(/\/max$/, "")
    .replace(/\/confirm$/, "");
}
