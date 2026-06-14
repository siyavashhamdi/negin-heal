import { useEffect } from "react";
import { useMutation, type MutationHookOptions, type MutationTuple } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/client/core";
import { useLoading } from "./useLoading";

/**
 * `useMutation` plus automatic global loading indicator via `LoadingProvider`.
 */
export const useMutationWithLoading = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables>
): MutationTuple<TData, TVariables> => {
  const { startLoading } = useLoading();
  const [mutate, result] = useMutation<TData, TVariables>(mutation, options);

  useEffect(() => {
    if (!result.loading) {
      return undefined;
    }
    return startLoading();
  }, [result.loading, startLoading]);

  return [mutate, result];
};
