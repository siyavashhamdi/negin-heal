import { useCallback } from "react";

type TableRefetchFn = () => void | Promise<unknown>;

/**
 * Refresh handler for entity tables: refetches data only (keeps search and filters).
 * Wire to {@link EntityTableShell} `onRefresh`; use clear-filters for reset behavior.
 */
export function useTableRefresh(refetch: TableRefetchFn): () => void {
  return useCallback(() => {
    void refetch();
  }, [refetch]);
}
