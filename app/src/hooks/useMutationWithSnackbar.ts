import { useEffect } from "react";
import { useMutation, type MutationHookOptions, type MutationTuple } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import type { OperationVariables } from "@apollo/client/core";
import { showErrorIfNotQueued } from "../utilities/graphql-error.util";
import { useLoading } from "./useLoading";
import { useSnackbar } from "./useSnackbar";

type MutationWithSnackbarOptions<
  TData,
  TVariables extends OperationVariables,
> = MutationHookOptions<TData, TVariables> & {
  readonly successMessage?: string;
  readonly errorMessage?: string;
  /** Runs after a successful mutation (after optional `successMessage`). */
  readonly onSuccess?: (data: TData) => void;
};

/**
 * `useMutation` with success/error snackbars, optional `onSuccess`, and loading integration.
 */
export const useMutationWithSnackbar = <
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode,
  options?: MutationWithSnackbarOptions<TData, TVariables>
): MutationTuple<TData, TVariables> => {
  const { showSuccess, showError } = useSnackbar();
  const { startLoading } = useLoading();

  const { successMessage, errorMessage, onSuccess, onCompleted, onError, ...mutationOptions } =
    options ?? {};

  const [mutate, result] = useMutation<TData, TVariables>(mutation, {
    ...mutationOptions,
    onCompleted: (data) => {
      if (successMessage) {
        showSuccess(successMessage);
      }
      onCompleted?.(data);
      onSuccess?.(data);
    },
    onError: (error) => {
      if (errorMessage) {
        showError(errorMessage);
      } else {
        showErrorIfNotQueued(showError, error);
      }
      onError?.(error);
    },
  });

  useEffect(() => {
    if (!result.loading) {
      return undefined;
    }
    return startLoading();
  }, [result.loading, startLoading]);

  return [mutate, result];
};
