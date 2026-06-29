import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

import { revokeAllCachedFileBlobUrls } from "./file-content-cache.blob-url-registry";
import {
  APOLLO_CACHE_LEGACY_STORAGE_KEYS,
  APOLLO_CACHE_STORAGE_KEY,
  APOLLO_CACHE_TABLE,
  FILE_CONTENT_CACHE_PERSIST_DEBOUNCE_MS,
  FILE_CONTENT_CACHE_TABLE,
  GQL_QUERY_CACHE_TABLE,
  SQL_JS_WASM_IDB_KEY,
} from "./file-content-cache.constants";
import {
  deleteFileContentCacheDatabase,
  readFileContentCacheDatabase,
  readIdbBytes,
  writeFileContentCacheDatabase,
  writeIdbBytes,
} from "./file-content-cache.idb";
import type { CachedFileRecord, FetchCachedFileParams } from "./file-content-cache.types";
import { GQL_QUERY_CACHE_DENYLIST } from "../gql-cache-policy";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let database: Database | null = null;
let initPromise: Promise<void> | null = null;
let persistTimeoutId: number | null = null;
let persistInFlight: Promise<void> | null = null;

const inflightFetches = new Map<string, Promise<Blob>>();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer;
  }

  return bytes.slice().buffer;
}

async function readWasmFromServiceWorkerCache(): Promise<ArrayBuffer | null> {
  if (typeof caches === "undefined") {
    return null;
  }

  try {
    const directMatch = await caches.match(sqlWasmUrl);
    if (directMatch?.ok) {
      return directMatch.arrayBuffer();
    }

    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      if (!cacheName.includes("precache") && !cacheName.includes("wasm")) {
        continue;
      }

      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      for (const request of requests) {
        if (!request.url.endsWith(".wasm")) {
          continue;
        }

        const response = await cache.match(request);
        if (response?.ok) {
          return response.arrayBuffer();
        }
      }
    }
  } catch (error: unknown) {
    console.warn("[File cache] Failed to read sql.js wasm from service worker cache.", error);
  }

  return null;
}

async function persistSqlJsWasmBinary(bytes: Uint8Array): Promise<void> {
  try {
    await writeIdbBytes(SQL_JS_WASM_IDB_KEY, bytes);
  } catch (error: unknown) {
    console.warn("[File cache] Failed to persist sql.js wasm binary.", error);
  }
}

async function loadSqlJsWasmBinary(): Promise<ArrayBuffer> {
  try {
    const persisted = await readIdbBytes(SQL_JS_WASM_IDB_KEY);
    if (persisted) {
      return toArrayBuffer(persisted);
    }
  } catch (error: unknown) {
    console.warn("[File cache] Failed to read persisted sql.js wasm binary.", error);
  }

  const cached = await readWasmFromServiceWorkerCache();
  if (cached) {
    void persistSqlJsWasmBinary(new Uint8Array(cached));
    return cached;
  }

  try {
    const wasmResponse = await fetch(sqlWasmUrl);
    if (!wasmResponse.ok) {
      throw new Error(`sql.js wasm fetch failed with status ${wasmResponse.status}.`);
    }

    const wasmBinary = await wasmResponse.arrayBuffer();
    void persistSqlJsWasmBinary(new Uint8Array(wasmBinary));
    return wasmBinary;
  } catch (error: unknown) {
    throw new Error("sql.js wasm is unavailable offline. Reconnect once to restore local cache.", {
      cause: error,
    });
  }
}

function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = (async (): Promise<SqlJsStatic> => {
      try {
        const wasmBinary = await loadSqlJsWasmBinary();
        return initSqlJs({ wasmBinary });
      } catch (error: unknown) {
        sqlJsPromise = null;
        throw error;
      }
    })();
  }

  return sqlJsPromise;
}

function schedulePersist(): void {
  if (typeof window === "undefined" || !database) {
    return;
  }

  if (persistTimeoutId != null) {
    window.clearTimeout(persistTimeoutId);
  }

  persistTimeoutId = window.setTimeout(() => {
    persistTimeoutId = null;
    void flushFileContentCachePersist().catch((error: unknown) => {
      console.warn("[File cache] Failed to flush SQLite database.", error);
    });
  }, FILE_CONTENT_CACHE_PERSIST_DEBOUNCE_MS);
}

async function flushFileContentCachePersist(): Promise<void> {
  if (!database) {
    return;
  }

  if (persistInFlight) {
    await persistInFlight;
    return;
  }

  const snapshot = database.export();

  persistInFlight = writeFileContentCacheDatabase(snapshot)
    .catch((error: unknown) => {
      console.warn("[File cache] Failed to persist SQLite database.", error);
    })
    .finally(() => {
      persistInFlight = null;
    });

  await persistInFlight;
}

function createSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS ${FILE_CONTENT_CACHE_TABLE} (
      file_id TEXT PRIMARY KEY NOT NULL,
      mime_type TEXT NOT NULL,
      file_name TEXT,
      size_bytes INTEGER NOT NULL,
      content BLOB NOT NULL,
      cached_at INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_${FILE_CONTENT_CACHE_TABLE}_cached_at
    ON ${FILE_CONTENT_CACHE_TABLE}(cached_at);
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ${APOLLO_CACHE_TABLE} (
      cache_key TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ${GQL_QUERY_CACHE_TABLE} (
      operation_name TEXT NOT NULL,
      variables_hash TEXT NOT NULL,
      variables_json TEXT NOT NULL,
      response_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (operation_name, variables_hash)
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_${GQL_QUERY_CACHE_TABLE}_updated_at
    ON ${GQL_QUERY_CACHE_TABLE}(updated_at);
  `);
}

function purgeDeniedCachedGqlQueries(db: Database): void {
  for (const deniedOperationName of GQL_QUERY_CACHE_DENYLIST) {
    db.run(`DELETE FROM ${GQL_QUERY_CACHE_TABLE} WHERE operation_name = ?`, [deniedOperationName]);
  }
}

function readCachedFileRecord(db: Database, fileId: string): CachedFileRecord | null {
  const statement = db.prepare(
    `SELECT mime_type, file_name, size_bytes, content, cached_at
     FROM ${FILE_CONTENT_CACHE_TABLE}
     WHERE file_id = ?`
  );

  try {
    statement.bind([fileId]);

    if (!statement.step()) {
      return null;
    }

    const [mimeType, fileName, sizeBytes, content, cachedAt] = statement.get() as [
      string,
      string | null,
      number,
      Uint8Array,
      number,
    ];

    if (!(content instanceof Uint8Array) || content.byteLength === 0) {
      return null;
    }

    return {
      fileId,
      mimeType: mimeType || "application/octet-stream",
      fileName: fileName ?? null,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : content.byteLength,
      content,
      cachedAt: Number.isFinite(cachedAt) ? cachedAt : Date.now(),
    };
  } finally {
    statement.free();
  }
}

function readApolloCachePayload(db: Database, cacheKey: string): string | null {
  const statement = db.prepare(`SELECT payload FROM ${APOLLO_CACHE_TABLE} WHERE cache_key = ?`);

  try {
    statement.bind([cacheKey]);

    if (!statement.step()) {
      return null;
    }

    const [payload] = statement.get() as [string];
    return typeof payload === "string" && payload.length > 0 ? payload : null;
  } finally {
    statement.free();
  }
}

function writeApolloCachePayload(db: Database, cacheKey: string, payload: string): void {
  db.run(
    `INSERT OR REPLACE INTO ${APOLLO_CACHE_TABLE} (cache_key, payload, updated_at)
     VALUES (?, ?, ?)`,
    [cacheKey, payload, Date.now()]
  );
}

function migrateApolloCacheFromLocalStorage(db: Database): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (readApolloCachePayload(db, APOLLO_CACHE_STORAGE_KEY)) {
    return false;
  }

  for (const legacyKey of APOLLO_CACHE_LEGACY_STORAGE_KEYS) {
    const raw = window.localStorage.getItem(legacyKey);
    if (!raw?.trim()) {
      continue;
    }

    writeApolloCachePayload(db, APOLLO_CACHE_STORAGE_KEY, raw);
    window.localStorage.removeItem(legacyKey);
    return true;
  }

  return false;
}

function clearLegacyApolloCacheLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const legacyKey of APOLLO_CACHE_LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(legacyKey);
  }
}

async function openDatabase(): Promise<{ db: Database; migratedApolloCache: boolean }> {
  const SQL = await getSqlJs();
  const persisted = await readFileContentCacheDatabase();

  const db = persisted ? new SQL.Database(persisted) : new SQL.Database();
  createSchema(db);
  purgeDeniedCachedGqlQueries(db);
  const migratedApolloCache = migrateApolloCacheFromLocalStorage(db);
  return { db, migratedApolloCache };
}

export async function initFileContentCache(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (database) {
    return;
  }

  if (!initPromise) {
    initPromise = openDatabase()
      .then(({ db, migratedApolloCache }) => {
        database = db;
        if (migratedApolloCache) {
          schedulePersist();
        }
      })
      .catch((error: unknown) => {
        initPromise = null;
        sqlJsPromise = null;
        database = null;
        console.warn("[File cache] Failed to initialize SQLite cache.", error);
      });
  }

  await initPromise;
}

export async function runWithFileContentDatabase<T>(fn: (db: Database) => T): Promise<T | null> {
  await initFileContentCache();

  if (!database) {
    return null;
  }

  return fn(database);
}

export function scheduleFileContentCachePersist(): void {
  schedulePersist();
}

export async function getPersistedApolloCacheJson(): Promise<string | null> {
  await initFileContentCache();

  if (!database) {
    return null;
  }

  try {
    return readApolloCachePayload(database, APOLLO_CACHE_STORAGE_KEY);
  } catch (error: unknown) {
    console.warn("[Offline cache] Failed to read Apollo cache from SQLite.", error);
    return null;
  }
}

export async function setPersistedApolloCacheJson(payload: string): Promise<void> {
  await initFileContentCache();

  if (!database) {
    return;
  }

  try {
    writeApolloCachePayload(database, APOLLO_CACHE_STORAGE_KEY, payload);
    schedulePersist();
  } catch (error: unknown) {
    console.warn("[Offline cache] Failed to persist Apollo cache to SQLite.", error);
  }
}

export async function clearPersistedApolloCacheInSqlite(): Promise<void> {
  await initFileContentCache();

  if (database) {
    try {
      database.run(`DELETE FROM ${APOLLO_CACHE_TABLE}`);
      await flushFileContentCachePersist();
    } catch (error: unknown) {
      console.warn("[Offline cache] Failed to clear Apollo cache from SQLite.", error);
    }
  }

  clearLegacyApolloCacheLocalStorage();
}

export async function getCachedFileRecord(fileId: string): Promise<CachedFileRecord | null> {
  await initFileContentCache();

  if (!database) {
    return null;
  }

  try {
    return readCachedFileRecord(database, fileId);
  } catch (error: unknown) {
    console.warn("[File cache] Failed to read cached file.", error);
    return null;
  }
}

async function storeCachedFileRecord(record: CachedFileRecord): Promise<void> {
  await initFileContentCache();

  if (!database) {
    return;
  }

  database.run(
    `INSERT OR REPLACE INTO ${FILE_CONTENT_CACHE_TABLE}
      (file_id, mime_type, file_name, size_bytes, content, cached_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      record.fileId,
      record.mimeType,
      record.fileName,
      record.sizeBytes,
      record.content,
      record.cachedAt,
    ]
  );

  schedulePersist();
}

export function fetchAndCacheFileContent(params: FetchCachedFileParams): Promise<Blob> {
  const fileId = params.fileId.trim();
  const networkUrl = params.networkUrl.trim();

  if (!fileId || !networkUrl) {
    throw new Error("File cache fetch requires fileId and networkUrl.");
  }

  const existingInflight = inflightFetches.get(fileId);
  if (existingInflight) {
    return existingInflight;
  }

  const fetchPromise = (async (): Promise<Blob> => {
    const cached = await getCachedFileRecord(fileId);
    if (cached) {
      return new Blob([cached.content], { type: cached.mimeType });
    }

    let response: Response;
    try {
      response = await fetch(networkUrl);
    } catch (error: unknown) {
      throw new Error("File fetch failed due to a network error.", { cause: error });
    }

    if (!response.ok) {
      throw new Error(`File fetch failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    const mimeType = params.mimeType?.trim() || blob.type.trim() || "application/octet-stream";
    const buffer = new Uint8Array(await blob.arrayBuffer());

    try {
      await storeCachedFileRecord({
        fileId,
        mimeType,
        fileName: params.fileName?.trim() || null,
        sizeBytes: buffer.byteLength,
        content: buffer,
        cachedAt: Date.now(),
      });
    } catch (error: unknown) {
      console.warn("[File cache] Failed to store downloaded file.", error);
    }

    return new Blob([buffer], { type: mimeType });
  })().finally(() => {
    inflightFetches.delete(fileId);
  });

  inflightFetches.set(fileId, fetchPromise);
  return fetchPromise;
}

export async function clearFileContentCache(): Promise<void> {
  inflightFetches.clear();
  revokeAllCachedFileBlobUrls();

  if (persistTimeoutId != null && typeof window !== "undefined") {
    window.clearTimeout(persistTimeoutId);
    persistTimeoutId = null;
  }

  if (persistInFlight) {
    try {
      await persistInFlight;
    } catch {
      // Ignore in-flight persist failures during logout cleanup.
    }
  }

  if (database) {
    try {
      database.run(`DELETE FROM ${FILE_CONTENT_CACHE_TABLE}`);
      database.run(`DELETE FROM ${APOLLO_CACHE_TABLE}`);
      database.run(`DELETE FROM ${GQL_QUERY_CACHE_TABLE}`);
      await flushFileContentCachePersist();
    } catch (error: unknown) {
      console.warn("[File cache] Failed to clear SQLite tables.", error);
    }

    try {
      database.close();
    } catch {
      // Ignore close errors during logout cleanup.
    }

    database = null;
  }

  initPromise = null;

  try {
    await deleteFileContentCacheDatabase();
  } catch (error: unknown) {
    console.warn("[File cache] Failed to delete persisted database.", error);
  }

  clearLegacyApolloCacheLocalStorage();
}
