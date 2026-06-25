import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";
import { getIsOfflineMode } from "./offline-state";

const APOLLO_CACHE_STORAGE_KEY = "negin-heal:apollo-cache";

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

function readSnapshot(): NormalizedCacheObject | null {
  if (typeof window === "undefined") {
    return null;
  }

  const keys = [APOLLO_CACHE_STORAGE_KEY, "negin-heal:apollo-cache-sync"];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as NormalizedCacheObject;
      if (hasCacheEntries(parsed)) {
        return parsed;
      }
    } catch {
      // Try the next storage key.
    }
  }

  return null;
}

export async function hydrateApolloCache(cache: ApolloCache): Promise<boolean> {
  try {
    const snapshot = readSnapshot();
    if (!snapshot) {
      return false;
    }

    cache.restore(snapshot);
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
    const snapshot = cache.extract();
    if (!hasCacheEntries(snapshot)) {
      return;
    }

    window.localStorage.setItem(APOLLO_CACHE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("[Offline cache] Failed to persist Apollo cache.", error);
  }
}

export async function clearPersistedApolloCache(): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(APOLLO_CACHE_STORAGE_KEY);
  }
}

export function registerApolloCacheUnloadPersist(cache: ApolloCache): void {
  const persistNow = (): void => persistApolloCache(cache);
  window.addEventListener("pagehide", persistNow);
}
