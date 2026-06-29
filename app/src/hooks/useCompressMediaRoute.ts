import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  clearCompressMediaRouteOwner,
  isCompressMediaRouteOwner,
} from "../routing/compress-media-route-owner.store";
import {
  closeCompressMediaRoute,
  isCompressMediaRoutePathname,
  openCompressMediaRoute,
} from "../routing/compress-media-route.util";

export function useCompressMediaRoute(
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
  const isCompressMediaRoute = isCompressMediaRoutePathname(location.pathname);
  const wasCompressMediaRouteRef = useRef(isCompressMediaRoute);
  const isOpen = enabled && isCompressMediaRoute && isCompressMediaRouteOwner(ownerId);

  const open = useCallback((): void => {
    if (!enabled) {
      return;
    }
    openCompressMediaRoute(ownerId, location.pathname, searchParams, navigate);
  }, [enabled, location.pathname, navigate, ownerId, searchParams]);

  const close = useCallback((): void => {
    closeCompressMediaRoute(ownerId, location.pathname, searchParams, navigate);
  }, [location.pathname, navigate, ownerId, searchParams]);

  useEffect(() => {
    if (
      wasCompressMediaRouteRef.current &&
      !isCompressMediaRoute &&
      isCompressMediaRouteOwner(ownerId)
    ) {
      clearCompressMediaRouteOwner(ownerId);
    }
    wasCompressMediaRouteRef.current = isCompressMediaRoute;
  }, [isCompressMediaRoute, ownerId]);

  return { isOpen, open, close };
}
