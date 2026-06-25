import {
  FILE_CONTENT_CACHE_IDB_KEY,
  FILE_CONTENT_CACHE_IDB_NAME,
  FILE_CONTENT_CACHE_IDB_STORE,
} from "./file-content-cache.constants";

function openFileContentCacheIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_CONTENT_CACHE_IDB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILE_CONTENT_CACHE_IDB_STORE)) {
        database.createObjectStore(FILE_CONTENT_CACHE_IDB_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open file content cache IndexedDB."));
    };
  });
}

function normalizeIdbBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return null;
}

export async function readIdbBytes(key: string): Promise<Uint8Array | null> {
  if (typeof indexedDB === "undefined") {
    return null;
  }

  const database = await openFileContentCacheIdb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FILE_CONTENT_CACHE_IDB_STORE, "readonly");
    const request = transaction.objectStore(FILE_CONTENT_CACHE_IDB_STORE).get(key);

    request.onsuccess = () => {
      resolve(normalizeIdbBytes(request.result));
    };

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to read IndexedDB key "${key}".`));
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function writeIdbBytes(key: string, data: Uint8Array): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const database = await openFileContentCacheIdb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FILE_CONTENT_CACHE_IDB_STORE, "readwrite");
    const request = transaction.objectStore(FILE_CONTENT_CACHE_IDB_STORE).put(data, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to write IndexedDB key "${key}".`));
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function deleteIdbBytes(key: string): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const database = await openFileContentCacheIdb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FILE_CONTENT_CACHE_IDB_STORE, "readwrite");
    const request = transaction.objectStore(FILE_CONTENT_CACHE_IDB_STORE).delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to delete IndexedDB key "${key}".`));
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function readFileContentCacheDatabase(): Promise<Uint8Array | null> {
  return readIdbBytes(FILE_CONTENT_CACHE_IDB_KEY);
}

export async function writeFileContentCacheDatabase(data: Uint8Array): Promise<void> {
  return writeIdbBytes(FILE_CONTENT_CACHE_IDB_KEY, data);
}

export async function deleteFileContentCacheDatabase(): Promise<void> {
  return deleteIdbBytes(FILE_CONTENT_CACHE_IDB_KEY);
}
