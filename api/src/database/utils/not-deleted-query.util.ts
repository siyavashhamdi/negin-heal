export const NOT_DELETED_OR_CONDITION = [
  { "audit.deletedAt": null },
  { "audit.deletedAt": { $exists: false } },
] as const;

export type MongoFilter = Record<string, unknown>;

export function hasDeletedAtFilter(query: MongoFilter): boolean {
  return "audit.deletedAt" in query;
}

/**
 * Adds a default filter that excludes soft-deleted documents.
 * Respects queries that already target audit.deletedAt explicitly.
 */
export function addNotDeletedCondition(query: MongoFilter = {}): MongoFilter {
  if (hasDeletedAtFilter(query)) {
    return query;
  }

  if (query.$or) {
    return {
      $and: [query, { $or: [...NOT_DELETED_OR_CONDITION] }],
    };
  }

  return {
    ...query,
    $or: [...NOT_DELETED_OR_CONDITION],
  };
}
