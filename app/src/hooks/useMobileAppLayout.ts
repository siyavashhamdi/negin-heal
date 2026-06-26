import { useMediaQuery } from "@mui/material";
import { isNativeCapacitorShell } from "../utils/apiBaseUrl.util";

/** Matches `MainLayout` mobile bottom-nav breakpoint (~900px). */
export const MOBILE_APP_LAYOUT_MAX_WIDTH = "56.1875rem";

export function useMobileAppLayout(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_APP_LAYOUT_MAX_WIDTH})`, { noSsr: true });
}

export function isMobileAppLayoutViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(`(max-width: ${MOBILE_APP_LAYOUT_MAX_WIDTH})`).matches;
}

/** Native APK or mobile viewport — profile tab uses embedded auth routes. */
export function shouldUseProfileAuthShell(): boolean {
  return isNativeCapacitorShell() || isMobileAppLayoutViewport();
}
