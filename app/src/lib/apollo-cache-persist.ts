import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";

import {
  getPersistedApolloCacheJson,
  setPersistedApolloCacheJson,
  clearPersistedApolloCacheInSqlite,
} from "./file-content-cache";
import { sanitizePersistedApolloSnapshot } from "./gql-cache-policy";
import { getIsOfflineMode } from "./offline-state";

function hasCacheEntries(snapshot: NormalizedCacheObject | null | undefined): boolean {
  if (!snapshot) {
    return false;
  }

  const root = snapshot.ROOT_QUERY;
  if (root && typeof root === "object" && Object.keys(root).length > 0) {
    return true;
  }

  return Object.keys(snapshot).some((key) => key !== "__META" && key !== "ROOT_QUERY");
}

function parseSnapshot(raw: string): NormalizedCacheObject | null {
  try {
    const parsed = JSON.parse(raw) as NormalizedCacheObject;
    return hasCacheEntries(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function hydrateApolloCache(cache: ApolloCache): Promise<boolean> {
  try {
    const raw = await getPersistedApolloCacheJson();
    if (!raw) {
      return false;
    }

    const snapshot = parseSnapshot(raw);
    if (!snapshot) {
      return false;
    }

    cache.restore(sanitizePersistedApolloSnapshot(snapshot));
    return true;
  } catch (error) {
    console.warn("[Offline cache] Failed to restore Apollo cache.", error);
    return false;
  }
}

export function persistApolloCache(cache: ApolloCache): void {
  if (typeof window === "undefined" || getIsOfflineMode()) {
    return;
  }

  try {
    const snapshot = sanitizePersistedApolloSnapshot(cache.extract() as NormalizedCacheObject);
    if (!hasCacheEntries(snapshot)) {
      return;
    }

    void setPersistedApolloCacheJson(JSON.stringify(snapshot)).catch((error: unknown) => {
      console.warn("[Offline cache] Failed to persist Apollo cache.", error);
    });
  } catch (error) {
    console.warn("[Offline cache] Failed to persist Apollo cache.", error);
  }
}

export async function clearPersistedApolloCache(): Promise<void> {
  await clearPersistedApolloCacheInSqlite();
}

export function registerApolloCacheUnloadPersist(cache: ApolloCache): void {
  const persistNow = (): void => persistApolloCache(cache);
  window.addEventListener("pagehide", persistNow);
}
