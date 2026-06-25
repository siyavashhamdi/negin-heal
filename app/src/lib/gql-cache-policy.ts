import type { DocumentNode } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import type { NormalizedCacheObject } from "@apollo/client";

/** GraphQL query operation names that must never be written to or read from offline cache. */
export const GQL_QUERY_CACHE_DENYLIST = ["UserLoginCaptcha"] as const;

export type GqlQueryCacheDenylistedOperationName = (typeof GQL_QUERY_CACHE_DENYLIST)[number];

const GQL_QUERY_CACHE_DENYLIST_SET = new Set<string>(GQL_QUERY_CACHE_DENYLIST);

export function resolveGqlOperationName(
  operationName: string | null | undefined,
  query: DocumentNode
): string {
  if (operationName?.trim()) {
    return operationName.trim();
  }

  const definition = getMainDefinition(query);
  if (definition.kind === "OperationDefinition" && definition.name?.value) {
    return definition.name.value;
  }

  return "anonymous";
}

export function isGqlQueryOperation(query: DocumentNode): boolean {
  const definition = getMainDefinition(query);
  return definition.kind === "OperationDefinition" && definition.operation === "query";
}

export function isGqlMutationOperation(query: DocumentNode): boolean {
  const definition = getMainDefinition(query);
  return definition.kind === "OperationDefinition" && definition.operation === "mutation";
}

export function isGqlSubscriptionOperation(query: DocumentNode): boolean {
  const definition = getMainDefinition(query);
  return definition.kind === "OperationDefinition" && definition.operation === "subscription";
}

export function isPersistableGqlQueryName(operationName: string | null | undefined): boolean {
  const normalized = operationName?.trim();
  if (!normalized) {
    return false;
  }

  return !GQL_QUERY_CACHE_DENYLIST_SET.has(normalized);
}

export function isPersistableGqlQueryOperation(
  operationName: string | null | undefined,
  query: DocumentNode
): boolean {
  if (!isGqlQueryOperation(query)) {
    return false;
  }

  if (isGqlMutationOperation(query) || isGqlSubscriptionOperation(query)) {
    return false;
  }

  const resolvedName = resolveGqlOperationName(operationName, query);
  return isPersistableGqlQueryName(resolvedName);
}

function operationNameToRootQueryFieldPrefix(operationName: string): string {
  return operationName.charAt(0).toLowerCase() + operationName.slice(1);
}

export { operationNameToRootQueryFieldPrefix };

function isDeniedRootQueryField(fieldKey: string): boolean {
  for (const deniedOperationName of GQL_QUERY_CACHE_DENYLIST) {
    const rootFieldPrefix = operationNameToRootQueryFieldPrefix(deniedOperationName);
    if (fieldKey === rootFieldPrefix || fieldKey.startsWith(`${rootFieldPrefix}(`)) {
      return true;
    }
  }

  return false;
}

export function sanitizePersistedApolloSnapshot(
  snapshot: NormalizedCacheObject
): NormalizedCacheObject {
  const rootQuery = snapshot.ROOT_QUERY;
  if (!rootQuery || typeof rootQuery !== "object") {
    return snapshot;
  }

  const nextRootQuery: Record<string, unknown> = {};

  for (const [fieldKey, value] of Object.entries(rootQuery)) {
    if (!isDeniedRootQueryField(fieldKey)) {
      nextRootQuery[fieldKey] = value;
    }
  }

  return {
    ...snapshot,
    ROOT_QUERY: nextRootQuery,
  };
}
