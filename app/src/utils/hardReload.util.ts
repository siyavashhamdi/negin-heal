async function clearCacheStorage(): Promise<void> {
  if (!("caches" in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

async function clearOfflineApolloCache(): Promise<void> {
  try {
    const { clearPersistedApolloCache } = await import("../lib/apollo-cache-persist");
    await clearPersistedApolloCache();
  } catch {
    // Best effort before reload.
  }
}

async function unregisterServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

async function bypassDocumentCache(): Promise<void> {
  await fetch(window.location.href, {
    cache: "reload",
    credentials: "same-origin",
  });
}

/**
 * Mimics the browser's "Empty Cache and Hard Reload":
 * clears Cache Storage, unregisters service workers, bypasses HTTP cache, then reloads.
 */
export async function emptyCacheAndHardReload(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await clearCacheStorage();
  } catch {
    // Best effort before reload.
  }

  try {
    await clearOfflineApolloCache();
  } catch {
    // Best effort before reload.
  }

  try {
    await unregisterServiceWorkers();
  } catch {
    // Best effort before reload.
  }

  try {
    await bypassDocumentCache();
  } catch {
    // Still reload even if the prefetch fails.
  }

  window.location.reload();
}
