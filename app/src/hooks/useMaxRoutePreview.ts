import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { clearMaxRouteOwner, isMaxRouteOwner } from "../routing/max-route-owner.store";
import { closeMaxRoute, isMaxRoutePathname, openMaxRoute } from "../routing/max-route.util";

export function useMaxRoutePreview(
  ownerId: string,
  enabled = true
): {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
} {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMaxRoute = isMaxRoutePathname(location.pathname);
  const wasMaxRouteRef = useRef(isMaxRoute);
  const isOpen = enabled && isMaxRoute && isMaxRouteOwner(ownerId);

  const open = useCallback((): void => {
    if (!enabled) {
      return;
    }
    openMaxRoute(ownerId, location.pathname, searchParams, navigate);
  }, [enabled, location.pathname, navigate, ownerId, searchParams]);

  const close = useCallback((): void => {
    closeMaxRoute(ownerId, location.pathname, searchParams, navigate);
  }, [location.pathname, navigate, ownerId, searchParams]);

  useEffect(() => {
    if (wasMaxRouteRef.current && !isMaxRoute && isMaxRouteOwner(ownerId)) {
      clearMaxRouteOwner(ownerId);
    }
    wasMaxRouteRef.current = isMaxRoute;
  }, [isMaxRoute, ownerId]);

  return { isOpen, open, close };
}
