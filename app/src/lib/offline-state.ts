let isBrowserOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;
let isBackendReachable = true;
let offlineListenersRegistered = false;

const offlineStatusListeners = new Set<(offline: boolean) => void>();

function notifyOfflineStatusListeners(): void {
  const offline = getIsOfflineMode();
  for (const listener of offlineStatusListeners) {
    listener(offline);
  }
}

export function getIsBrowserOffline(): boolean {
  return isBrowserOffline;
}

/** True when the browser is offline or the API is unreachable — use cached data only. */
export function getIsOfflineMode(): boolean {
  return isBrowserOffline || !isBackendReachable;
}

export function markBackendReachable(): void {
  if (!isBackendReachable) {
    isBackendReachable = true;
    notifyOfflineStatusListeners();
  }
}

export function markBackendUnreachable(): void {
  if (isBackendReachable) {
    isBackendReachable = false;
    notifyOfflineStatusListeners();
  }
}

export function subscribeOfflineModeStatus(listener: (offline: boolean) => void): () => void {
  offlineStatusListeners.add(listener);
  listener(getIsOfflineMode());

  return () => {
    offlineStatusListeners.delete(listener);
  };
}

export function initBrowserOfflineListeners(): void {
  if (offlineListenersRegistered || typeof window === "undefined") {
    return;
  }

  offlineListenersRegistered = true;

  const syncBrowserOfflineStatus = (): void => {
    const nextOffline = !navigator.onLine;
    if (nextOffline !== isBrowserOffline) {
      isBrowserOffline = nextOffline;
      notifyOfflineStatusListeners();
    }
  };

  window.addEventListener("online", () => {
    syncBrowserOfflineStatus();
    void probeBackendReachability().then((reachable) => {
      if (reachable) {
        markBackendReachable();
      }
    });
  });
  window.addEventListener("offline", syncBrowserOfflineStatus);
}

const BACKEND_PROBE_TIMEOUT_MS = 800;

export async function probeBackendReachability(
  timeoutMs = BACKEND_PROBE_TIMEOUT_MS
): Promise<boolean> {
  if (typeof window === "undefined" || getIsBrowserOffline()) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch("/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "query OfflineProbe { __typename }" }),
      credentials: "include",
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return false;
    }

    const body = (await response.json()) as { data?: unknown; errors?: unknown };
    return body.data !== undefined || body.errors !== undefined;
  } catch {
    return false;
  }
}
