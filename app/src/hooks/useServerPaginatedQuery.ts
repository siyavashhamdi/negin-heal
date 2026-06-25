import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import type { DocumentNode, OperationVariables } from "@apollo/client";

import { useTableRefresh } from "./useTableRefresh";
import { resolveQueryFetchPolicy } from "../lib/offline-fetch-policy.util";
import { getIsOfflineMode } from "../lib/offline-state";

/** Shape returned by paginated GraphQL list fields (items + meta). */
export interface ServerPageResult<TItem> {
  items: readonly TItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServerPaginatedPaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalFiltered: number;
  pagedRowsCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface UseServerPaginatedQueryOptions<
  TData,
  TVariables extends OperationVariables,
  TSourceItem,
  TRow,
> {
  query: DocumentNode;
  /** Build GraphQL variables; `page` / `pageSize` come from hook state. */
  variables: (ctx: { page: number; pageSize: number }) => TVariables;
  selectPage: (data: TData | undefined) => ServerPageResult<TSourceItem> | null | undefined;
  mapItem: (item: TSourceItem) => TRow;
  initialPageSize?: number;
  /** Append loaded pages instead of replacing rows; useful for infinite card feeds. */
  accumulatePages?: boolean;
  /** When any value changes, reset to page 1 (e.g. debounced search, applied filters). */
  resetPageDeps?: readonly unknown[];
  /** Skip the backing GraphQL query while keeping table state initialized. */
  skip?: boolean;
}

export interface UseServerPaginatedQueryResult<TRow> {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  items: TRow[];
  loading: boolean;
  isPageTransition: boolean;
  error: unknown;
  refetch: () => void;
  /** Refetch only; does not clear search or filters. */
  onRefresh: () => void;
  hasNextPage: boolean;
  loadNextPage: () => void;
  pagination: ServerPaginatedPaginationProps;
}

/**
 * Server-side paginated GraphQL lists (Param table + stored procedure).
 * - Uses `network-only` to avoid stale Apollo pages
 * - Ignores responses whose `page` does not match the requested page
 * - Keeps pager totals stable while the next page loads
 */
export function useServerPaginatedQuery<
  TData,
  TVariables extends OperationVariables,
  TSourceItem,
  TRow,
>(
  options: UseServerPaginatedQueryOptions<TData, TVariables, TSourceItem, TRow>
): UseServerPaginatedQueryResult<TRow> {
  const {
    query,
    variables: buildVariables,
    selectPage,
    mapItem,
    initialPageSize = 10,
    accumulatePages = false,
    resetPageDeps = [],
    skip = false,
  } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [accumulatedPages, setAccumulatedPages] = useState<Record<number, TRow[]>>({});
  const lastTotalsRef = useRef({ total: 0, totalPages: 1 });

  const variables = useMemo(
    () => buildVariables({ page, pageSize }),
    [buildVariables, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
    if (accumulatePages) {
      setAccumulatedPages({});
    }
    // resetPageDeps is intentionally dynamic (caller-defined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetPageDeps);

  const { data, loading, error, refetch } = useQuery<TData, TVariables>(query, {
    variables,
    fetchPolicy: resolveQueryFetchPolicy("network-only"),
    notifyOnNetworkStatusChange: true,
    skip,
  });

  const pageResult = skip ? null : selectPage(data);
  const isMatchingPage = pageResult != null && pageResult.page === page;

  useEffect(() => {
    if (!isMatchingPage || pageResult == null) {
      return;
    }
    if (page > pageResult.totalPages && pageResult.totalPages > 0) {
      setPage(pageResult.totalPages);
    }
  }, [isMatchingPage, page, pageResult]);

  if (isMatchingPage && pageResult != null) {
    lastTotalsRef.current = {
      total: pageResult.total,
      totalPages: Math.max(1, pageResult.totalPages),
    };
  }

  const currentPageItems = useMemo(() => {
    if (!isMatchingPage || pageResult == null) {
      return [];
    }
    return pageResult.items.map(mapItem);
  }, [isMatchingPage, pageResult, mapItem]);

  useEffect(() => {
    if (!accumulatePages || !isMatchingPage || pageResult == null) {
      return;
    }
    setAccumulatedPages((prev) =>
      page === 1 ? { [page]: currentPageItems } : { ...prev, [page]: currentPageItems }
    );
  }, [accumulatePages, currentPageItems, isMatchingPage, page, pageResult]);

  const accumulatedItems = useMemo(
    () =>
      Object.entries(accumulatedPages)
        .sort(([pageA], [pageB]) => Number(pageA) - Number(pageB))
        .flatMap(([, pageItems]) => pageItems),
    [accumulatedPages]
  );

  const items = accumulatePages ? accumulatedItems : currentPageItems;

  const displayTotal = isMatchingPage ? (pageResult?.total ?? 0) : lastTotalsRef.current.total;
  const displayTotalPages = isMatchingPage
    ? Math.max(1, pageResult?.totalPages ?? 1)
    : lastTotalsRef.current.totalPages;

  const isPageTransition = !getIsOfflineMode() && loading && !isMatchingPage;

  const onRefresh = useTableRefresh(refetch);
  const hasNextPage = page < displayTotalPages;
  const loadNextPage = useCallback((): void => {
    if (loading || !hasNextPage) {
      return;
    }
    setPage((currentPage) => Math.min(currentPage + 1, displayTotalPages));
  }, [displayTotalPages, hasNextPage, loading]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    items,
    loading: !skip && !getIsOfflineMode() && (loading || isPageTransition) && items.length === 0,
    isPageTransition,
    error,
    refetch: () => {
      void refetch();
    },
    onRefresh,
    hasNextPage,
    loadNextPage,
    pagination: {
      currentPage: page,
      pageSize,
      totalPages: displayTotalPages,
      totalFiltered: displayTotal,
      pagedRowsCount: items.length,
      onPageChange: setPage,
      onPageSizeChange: (nextPageSize) => {
        setPageSize(nextPageSize);
        setPage(1);
        if (accumulatePages) {
          setAccumulatedPages({});
        }
      },
    },
  };
}
