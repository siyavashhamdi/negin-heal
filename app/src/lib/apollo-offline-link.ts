import { ApolloLink } from "@apollo/client";
import type { ApolloCache, DocumentNode } from "@apollo/client";
import { from, of, throwError } from "rxjs";
import { catchError, switchMap, tap } from "rxjs/operators";
import { persistApolloCache } from "./apollo-cache-persist";
import {
  getCachedGqlQueryResponse,
  upsertCachedGqlQuery,
} from "./file-content-cache/gql-query-cache.service";
import {
  isGqlMutationOperation,
  isGqlQueryOperation,
  isPersistableGqlQueryOperation,
  operationNameToRootQueryFieldPrefix,
  resolveGqlOperationName,
} from "./gql-cache-policy";
import { getIsBrowserOffline, getIsOfflineMode, markBackendUnreachable } from "./offline-state";

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

function writeCachedQueryData(
  cache: ApolloCache,
  query: DocumentNode,
  variables: Record<string, unknown> | undefined,
  data: Record<string, unknown>
): void {
  try {
    cache.writeQuery({
      query,
      variables,
      data,
    });
  } catch {
    // Ignore cache shape mismatches during offline fallback.
  }
}

function evictNonPersistableQueryFromMemoryCache(
  cache: ApolloCache,
  operation: ApolloLink.Operation
): void {
  const operationName = resolveGqlOperationName(operation.operationName, operation.query);
  const rootFieldPrefix = operationNameToRootQueryFieldPrefix(operationName);

  try {
    cache.evict({ id: "ROOT_QUERY", fieldName: rootFieldPrefix });
    cache.gc();
  } catch {
    // Ignore eviction failures for non-root fields.
  }
}

function persistSuccessfulQuery(
  cache: ApolloCache,
  operation: ApolloLink.Operation,
  data: Record<string, unknown>
): void {
  if (!isPersistableGqlQueryOperation(operation.operationName, operation.query)) {
    evictNonPersistableQueryFromMemoryCache(cache, operation);
    return;
  }

  const operationName = resolveGqlOperationName(operation.operationName, operation.query);
  const variables = (operation.variables as Record<string, unknown> | undefined) ?? {};

  void upsertCachedGqlQuery({
    operationName,
    variables,
    response: data,
  }).catch((error: unknown) => {
    console.warn("[Offline cache] Failed to persist GraphQL query to SQLite.", error);
  });

  persistApolloCache(cache);
}

function resolveOfflineQueryData(
  cache: ApolloCache,
  operation: ApolloLink.Operation
): Record<string, unknown> | null {
  if (!isPersistableGqlQueryOperation(operation.operationName, operation.query)) {
    return null;
  }

  const variables = (operation.variables as Record<string, unknown> | undefined) ?? {};
  return readCachedQueryData(cache, operation.query, variables);
}

function resolveOfflineQueryDataFromSqlite(
  operation: ApolloLink.Operation
): Promise<Record<string, unknown> | null> {
  if (!isPersistableGqlQueryOperation(operation.operationName, operation.query)) {
    return Promise.resolve(null);
  }

  const operationName = resolveGqlOperationName(operation.operationName, operation.query);
  const variables = (operation.variables as Record<string, unknown> | undefined) ?? {};

  return getCachedGqlQueryResponse(operationName, variables);
}

export function createCacheFallbackLink(cache: ApolloCache): ApolloLink {
  return new ApolloLink((operation, forward) => {
    if (isGqlMutationOperation(operation.query)) {
      return forward(operation);
    }

    if (!isGqlQueryOperation(operation.query)) {
      return forward(operation);
    }

    if (getIsOfflineMode() || getIsBrowserOffline()) {
      const memoryData = resolveOfflineQueryData(cache, operation);
      if (memoryData) {
        operation.setContext({
          ...operation.getContext(),
          offlineCacheFallback: true,
        });
        return of({ data: memoryData });
      }

      return from(resolveOfflineQueryDataFromSqlite(operation)).pipe(
        switchMap((sqliteData) => {
          if (!sqliteData) {
            return forward(operation);
          }

          writeCachedQueryData(
            cache,
            operation.query,
            operation.variables as Record<string, unknown> | undefined,
            sqliteData
          );

          operation.setContext({
            ...operation.getContext(),
            offlineCacheFallback: true,
            offlineSqliteCache: true,
          });

          return of({ data: sqliteData });
        })
      );
    }

    return forward(operation).pipe(
      tap((result) => {
        if (!result.data || getIsOfflineMode()) {
          return;
        }

        persistSuccessfulQuery(cache, operation, result.data as Record<string, unknown>);
      }),
      catchError((error: unknown) => {
        const memoryData = resolveOfflineQueryData(cache, operation);
        if (memoryData) {
          markBackendUnreachable();
          operation.setContext({
            ...operation.getContext(),
            offlineCacheFallback: true,
          });
          return of({ data: memoryData });
        }

        return from(resolveOfflineQueryDataFromSqlite(operation)).pipe(
          switchMap((sqliteData) => {
            if (sqliteData) {
              markBackendUnreachable();
              writeCachedQueryData(
                cache,
                operation.query,
                operation.variables as Record<string, unknown> | undefined,
                sqliteData
              );
              operation.setContext({
                ...operation.getContext(),
                offlineCacheFallback: true,
                offlineSqliteCache: true,
              });
              return of({ data: sqliteData });
            }

            markBackendUnreachable();
            return throwError(() => error);
          })
        );
      })
    );
  });
}
