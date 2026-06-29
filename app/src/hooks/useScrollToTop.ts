import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPathnameForScrollReset } from "../routing/scroll-reset-path.util";

/**
 * Scrolls the window to the top when navigating to a different page, but not
 * when opening same-page overlays (e.g. product purchase or media viewer).
 */
export const useScrollToTop = (): void => {
  const { pathname } = useLocation();
  const scrollResetPath = getPathnameForScrollReset(pathname);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [scrollResetPath]);
};
