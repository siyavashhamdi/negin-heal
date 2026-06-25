export type CachedGqlQueryRecord = {
  readonly operationName: string;
  readonly variables: Record<string, unknown>;
  readonly response: Record<string, unknown>;
  readonly cachedAt: number;
};

export type UpsertCachedGqlQueryParams = {
  readonly operationName: string;
  readonly variables?: Record<string, unknown> | null;
  readonly response: Record<string, unknown>;
};
