export {
  APOLLO_CACHE_LEGACY_STORAGE_KEYS,
  APOLLO_CACHE_STORAGE_KEY,
  APOLLO_CACHE_TABLE,
  FILE_CONTENT_CACHE_IDB_KEY,
  FILE_CONTENT_CACHE_IDB_NAME,
  FILE_CONTENT_CACHE_IDB_STORE,
  FILE_CONTENT_CACHE_PERSIST_DEBOUNCE_MS,
  FILE_CONTENT_CACHE_TABLE,
  GQL_QUERY_CACHE_TABLE,
} from "./file-content-cache.constants";
export {
  acquireCachedFileBlobUrl,
  releaseCachedFileBlobUrl,
  revokeAllCachedFileBlobUrls,
} from "./file-content-cache.blob-url-registry";
export {
  clearFileContentCache,
  clearPersistedApolloCacheInSqlite,
  fetchAndCacheFileContent,
  getCachedFileRecord,
  getPersistedApolloCacheJson,
  initFileContentCache,
  runWithFileContentDatabase,
  scheduleFileContentCachePersist,
  setPersistedApolloCacheJson,
} from "./file-content-cache.service";
export {
  clearCachedGqlQueries,
  getCachedGqlQuery,
  getCachedGqlQueryResponse,
  listCachedGqlQueries,
  upsertCachedGqlQuery,
} from "./gql-query-cache.service";
export type { CachedGqlQueryRecord, UpsertCachedGqlQueryParams } from "./gql-query-cache.types";
export { stableStringifyVariables } from "./gql-query-cache.util";
export type { CachedFileRecord, FetchCachedFileParams } from "./file-content-cache.types";
