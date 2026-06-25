import { ApolloLink } from "@apollo/client";
import type { ApolloCache, DocumentNode } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { persistApolloCache } from "./apollo-cache-persist";
import { getIsOfflineMode, markBackendUnreachable } from "./offline-state";

function isQueryOperation(query: DocumentNode): boolean {
  const definition = getMainDefinition(query);
  return definition.kind === "OperationDefinition" && definition.operation === "query";
}

function readCachedQueryData(
  cache: ApolloCache,
  query: DocumentNode,
  variables: Record<string, unknown> | undefined
): Record<string, unknown> | null {
  try {
    const data = cache.readQuery({
      query,
      variables,
      returnPartialData: true,
    }) as Record<string, unknown> | null;

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function createCacheFallbackLink(cache: ApolloCache): ApolloLink {
  return new ApolloLink((operation, forward) => {
    if (!isQueryOperation(operation.query)) {
      return forward(operation);
    }

    return forward(operation).pipe(
      tap((result) => {
        if (result.data && !getIsOfflineMode()) {
          persistApolloCache(cache);
        }
      }),
      catchError((error: unknown) => {
        const cachedData = readCachedQueryData(
          cache,
          operation.query,
          operation.variables as Record<string, unknown> | undefined
        );

        if (cachedData) {
          markBackendUnreachable();
          operation.setContext({
            ...operation.getContext(),
            offlineCacheFallback: true,
          });
          return of({ data: cachedData });
        }

        markBackendUnreachable();
        return throwError(() => error);
      })
    );
  });
}
