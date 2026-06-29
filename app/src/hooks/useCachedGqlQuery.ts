import { useEffect, useMemo, useState } from "react";

import type { CachedGqlQueryRecord } from "../lib/file-content-cache/gql-query-cache.types";
import { getCachedGqlQuery } from "../lib/file-content-cache/gql-query-cache.service";
import { stableStringifyVariables } from "../lib/file-content-cache/gql-query-cache.util";

type UseCachedGqlQueryState<TData> = {
  readonly record: CachedGqlQueryRecord | null;
  readonly data: TData | null;
  readonly isLoading: boolean;
};

type UseCachedGqlQueryParams = {
  readonly operationName: string;
  readonly variables?: Record<string, unknown> | null;
  readonly enabled?: boolean;
};

export function useCachedGqlQuery<TData = Record<string, unknown>>({
  operationName,
  variables,
  enabled = true,
}: UseCachedGqlQueryParams): UseCachedGqlQueryState<TData> {
  const variablesKey = useMemo(() => stableStringifyVariables(variables), [variables]);

  const [state, setState] = useState<UseCachedGqlQueryState<TData>>({
    record: null,
    data: null,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled || !operationName.trim()) {
      setState({
        record: null,
        data: null,
        isLoading: false,
      });
      return undefined;
    }

    let cancelled = false;

    const load = async (): Promise<void> => {
      setState((current) => ({
        ...current,
        isLoading: true,
      }));

      try {
        const record = await getCachedGqlQuery(operationName, variables ?? {});
        if (cancelled) {
          return;
        }

        setState({
          record,
          data: (record?.response as TData | undefined) ?? null,
          isLoading: false,
        });
      } catch {
        if (!cancelled) {
          setState({
            record: null,
            data: null,
            isLoading: false,
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, operationName, variables, variablesKey]);

  return state;
}
