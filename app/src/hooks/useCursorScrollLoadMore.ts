import { useEffect, useRef, type RefObject } from "react";
import {
  CURSOR_FETCH_RETRY_DELAY_MS,
  resolveCursorFetchMaxAttempts,
  sleepMs,
} from "../lib/cursor-fetch-retry.util";

type UseCursorScrollLoadMoreOptions = {
  readonly loadMoreRef: RefObject<HTMLElement | null>;
  readonly hasNextPage: boolean;
  readonly enabled?: boolean;
  readonly rootMargin?: string;
  readonly root?: Element | null;
  readonly getRoot?: () => Element | null;
  readonly observeDeps?: readonly unknown[];
  readonly loadMore: () => Promise<boolean>;
};

/**
 * Infinite-scroll sentinel: loads the next cursor page when visible.
 * Retries failed loads up to 3 times (1s apart). While the subscription is offline,
 * the first bottom reach uses a single attempt; after the user scrolls away and back, full retries apply.
 */
export function useCursorScrollLoadMore({
  loadMoreRef,
  hasNextPage,
  enabled = true,
  rootMargin = "320px 0px",
  root = null,
  getRoot,
  observeDeps = [],
  loadMore,
}: UseCursorScrollLoadMoreOptions): void {
  const useFullRetryOnNextIntersectRef = useRef(false);
  const blockedWhileIntersectingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const loadMoreRefStable = useRef(loadMore);

  loadMoreRefStable.current = loadMore;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || !enabled) {
      return undefined;
    }

    const observerRoot = getRoot?.() ?? root;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (!entry.isIntersecting) {
          useFullRetryOnNextIntersectRef.current = true;
          blockedWhileIntersectingRef.current = false;
          return;
        }

        if (blockedWhileIntersectingRef.current || isLoadingRef.current) {
          return;
        }

        isLoadingRef.current = true;
        const useFullRetry = useFullRetryOnNextIntersectRef.current;
        useFullRetryOnNextIntersectRef.current = false;

        void (async () => {
          try {
            const maxAttempts = resolveCursorFetchMaxAttempts(useFullRetry);
            let success = false;

            for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
              try {
                success = await loadMoreRefStable.current();
              } catch {
                success = false;
              }

              if (success) {
                break;
              }

              if (attempt < maxAttempts - 1) {
                await sleepMs(CURSOR_FETCH_RETRY_DELAY_MS);
              }
            }

            if (!success) {
              blockedWhileIntersectingRef.current = true;
            }
          } finally {
            isLoadingRef.current = false;
          }
        })();
      },
      { root: observerRoot, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enabled, getRoot, hasNextPage, loadMoreRef, root, rootMargin, ...observeDeps]);
}
