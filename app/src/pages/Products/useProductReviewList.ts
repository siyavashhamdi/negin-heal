import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { useCursorScrollLoadMore } from "../../hooks/useCursorScrollLoadMore";

import { PRODUCT_REVIEW_LIST_QUERY } from "../../graphql/queries/productReviewList.query";
import { USER_PRODUCT_REVIEW_LIST_QUERY } from "../../graphql/queries/userProductReviewList.query";
import {
  buildAdminProductReviewListVariables,
  buildEndUserProductReviewListVariables,
  PRODUCT_REVIEW_LIST_PAGE_SIZE,
  type AdminProductReviewRecord,
  type ProductReviewListMode,
  type ProductReviewListQuery,
  type ProductReviewListQueryVariables,
  type ProductReviewSummaryStats,
  type EndUserProductReviewRecord,
  mapProductReviewRatingSummaryToStats,
  type UserProductReviewListQuery,
  type UserProductReviewListQueryVariables,
} from "./product-reviews.api";

type ProductReviewListScrollRoot = "list" | "parent";

type ReviewListItem = EndUserProductReviewRecord | AdminProductReviewRecord;

type ReviewListPage = {
  readonly items: ReviewListItem[];
  readonly pagination: {
    readonly total: number;
    readonly hasNextPage: boolean;
    readonly endCursor?: string | null;
  };
  readonly summary?: ProductReviewSummaryStats | null;
};

type UseProductReviewListOptions = {
  readonly productId: string;
  readonly mode: ProductReviewListMode;
  readonly enabled: boolean;
  readonly starsFilter: number | null;
  readonly scrollRoot?: ProductReviewListScrollRoot;
};

export type ProductReviewListController = {
  readonly items: ReadonlyArray<EndUserProductReviewRecord | AdminProductReviewRecord>;
  readonly totalCount: number;
  readonly ratingSummary: ProductReviewSummaryStats;
  readonly loading: boolean;
  readonly isFetchingMore: boolean;
  readonly error: unknown;
  readonly refetch: () => Promise<void>;
  readonly hasNextPage: boolean;
  readonly loadMoreRef: RefObject<HTMLDivElement>;
  readonly scrollContainerRef: RefObject<HTMLDivElement>;
};

function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;

  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

function appendUniqueReviewItems(
  previousItems: ReadonlyArray<ReviewListItem>,
  incomingItems: ReadonlyArray<ReviewListItem>
): ReviewListItem[] {
  const existingIds = new Set(previousItems.map((item) => item.id));
  const newItems = incomingItems.filter((item) => !existingIds.has(item.id));

  if (newItems.length === 0) {
    return [...previousItems];
  }

  return [...previousItems, ...newItems];
}

export function useProductReviewList({
  productId,
  mode,
  enabled,
  starsFilter,
  scrollRoot = "list",
}: UseProductReviewListOptions): ProductReviewListController {
  const isAdminMode = mode === "admin";

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fetchingMoreRef = useRef(false);
  const hasPaginatedRef = useRef(false);

  const [items, setItems] = useState<ReviewListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [ratingSummary, setRatingSummary] = useState<ProductReviewSummaryStats>(() =>
    mapProductReviewRatingSummaryToStats(null)
  );

  const listVariables = useMemo(
    () =>
      isAdminMode
        ? buildAdminProductReviewListVariables(
            productId,
            starsFilter,
            null,
            PRODUCT_REVIEW_LIST_PAGE_SIZE
          )
        : buildEndUserProductReviewListVariables(
            productId,
            starsFilter,
            null,
            PRODUCT_REVIEW_LIST_PAGE_SIZE
          ),
    [productId, isAdminMode, starsFilter]
  );

  const queryDocument = isAdminMode ? PRODUCT_REVIEW_LIST_QUERY : USER_PRODUCT_REVIEW_LIST_QUERY;

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<
    ProductReviewListQuery | UserProductReviewListQuery,
    ProductReviewListQueryVariables | UserProductReviewListQueryVariables
  >(queryDocument, {
    variables: listVariables,
    skip: !enabled || !productId,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const queryField = isAdminMode ? "productReviewList" : "userProductReviewList";

  const page = useMemo((): ReviewListPage | undefined => {
    if (isAdminMode) {
      return (data as ProductReviewListQuery | undefined)?.productReviewList;
    }

    return (data as UserProductReviewListQuery | undefined)?.userProductReviewList;
  }, [data, isAdminMode]);

  useEffect(() => {
    hasPaginatedRef.current = false;
    setItems([]);
    setTotalCount(0);
    setHasNextPage(false);
    setEndCursor(null);
    setRatingSummary(mapProductReviewRatingSummaryToStats(null));
  }, [productId, listVariables]);

  useEffect(() => {
    if (!page) {
      return;
    }

    if (
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.fetchMore
    ) {
      return;
    }

    if (!hasPaginatedRef.current) {
      setItems(page.items);
      setTotalCount(page.pagination.total);
      setHasNextPage(page.pagination.hasNextPage);
      setEndCursor(page.pagination.endCursor ?? null);
      setRatingSummary(mapProductReviewRatingSummaryToStats(page.summary));
    }
  }, [networkStatus, page]);

  const isFetchingMore = networkStatus === NetworkStatus.fetchMore;
  const isInitialLoading =
    enabled &&
    items.length === 0 &&
    (loading ||
      networkStatus === NetworkStatus.loading ||
      networkStatus === NetworkStatus.setVariables);

  const loadNextPage = useCallback(async (): Promise<boolean> => {
    const nextCursor = endCursor ?? items[items.length - 1]?.id ?? null;
    if (fetchingMoreRef.current || loading || isFetchingMore || !hasNextPage || !nextCursor) {
      return false;
    }

    fetchingMoreRef.current = true;
    try {
      const result = await fetchMore({
        variables: {
          input: {
            ...listVariables.input,
            options: {
              ...listVariables.input.options,
              startCursor: nextCursor,
            },
          },
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          const previousPage = previous[queryField as keyof typeof previous] as
            | ReviewListPage
            | undefined;
          const nextPage = fetchMoreResult?.[queryField as keyof typeof fetchMoreResult] as
            | ReviewListPage
            | undefined;

          if (!previousPage || !nextPage) {
            return previous;
          }

          return {
            ...previous,
            [queryField]: {
              ...previousPage,
              items: appendUniqueReviewItems(previousPage.items, nextPage.items),
              pagination: nextPage.pagination,
            },
          };
        },
      });

      const nextPage = result.data?.[queryField as keyof typeof result.data] as
        | ReviewListPage
        | undefined;

      if (!nextPage) {
        return false;
      }

      hasPaginatedRef.current = true;
      setItems((previousItems) => appendUniqueReviewItems(previousItems, nextPage.items));
      setTotalCount(nextPage.pagination.total);
      setHasNextPage(nextPage.pagination.hasNextPage);
      setEndCursor(nextPage.pagination.endCursor ?? null);
      return true;
    } catch {
      return false;
    } finally {
      fetchingMoreRef.current = false;
    }
  }, [
    endCursor,
    fetchMore,
    hasNextPage,
    isFetchingMore,
    items,
    listVariables,
    loading,
    queryField,
  ]);

  useCursorScrollLoadMore({
    loadMoreRef,
    hasNextPage,
    enabled: !isInitialLoading && (scrollRoot !== "list" || scrollContainerRef.current !== null),
    rootMargin: "120px 0px",
    getRoot: () =>
      scrollRoot === "parent"
        ? findScrollableAncestor(loadMoreRef.current)
        : scrollContainerRef.current,
    observeDeps: [items.length, scrollRoot, isInitialLoading],
    loadMore: loadNextPage,
  });

  const refetchList = useCallback(async (): Promise<void> => {
    hasPaginatedRef.current = false;
    await refetch();
  }, [refetch]);

  return {
    items,
    totalCount,
    ratingSummary,
    loading: isInitialLoading,
    isFetchingMore,
    error,
    refetch: refetchList,
    hasNextPage,
    loadMoreRef,
    scrollContainerRef,
  };
}
