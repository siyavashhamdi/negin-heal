import { useEffect } from "react";
import { useQuery, type QueryHookOptions, type QueryResult } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/client/core";
import { useLoading } from "./useLoading";

/**
 * `useQuery` plus automatic global loading indicator via `LoadingProvider`.
 */
export const useQueryWithLoading = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> => {
  const { startLoading } = useLoading();
  const result = useQuery<TData, TVariables>(query, options as QueryHookOptions<TData, TVariables>);

  useEffect(() => {
    if (!result.loading) {
      return undefined;
    }
    return startLoading();
  }, [result.loading, startLoading]);

  return result;
};
