import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { resolveGraphqlHttpUrl } from "../utils/apiBaseUrl.util";
import { isGeneralUpdatesSubscriptionOffline } from "./general-updates-listeners";
import { resetSubscriptionRetryFromStart } from "./subscription-retry.util";

let isBrowserOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;
let isBackendReachable = true;
let isBackendReachabilityKnown = typeof window === "undefined";
let offlineListenersRegistered = false;

const offlineStatusListeners = new Set<(offline: boolean) => void>();
const offlineBannerDismissListeners = new Set<() => void>();
let offlineBannerDismissed = false;

function notifyOfflineBannerDismissListeners(): void {
  for (const listener of offlineBannerDismissListeners) {
    listener();
  }
}

export function dismissOfflineBanner(): void {
  if (!offlineBannerDismissed) {
    offlineBannerDismissed = true;
    notifyOfflineBannerDismissListeners();
  }
}

export function isOfflineBannerDismissed(): boolean {
  return offlineBannerDismissed;
}

export function subscribeOfflineBannerDismiss(listener: () => void): () => void {
  offlineBannerDismissListeners.add(listener);
  listener();

  return () => {
    offlineBannerDismissListeners.delete(listener);
  };
}

function notifyOfflineStatusListeners(): void {
  const offline = getIsOfflineMode();
  for (const listener of offlineStatusListeners) {
    listener(offline);
  }
}

export function getIsBrowserOffline(): boolean {
  return isBrowserOffline;
}

/** True when the browser is offline or the API is confirmed unreachable — use cached data only. */
export function getIsOfflineMode(): boolean {
  if (isBrowserOffline) {
    return true;
  }

  return isBackendReachabilityKnown && !isBackendReachable;
}

export function markBackendReachable(): void {
  isBackendReachabilityKnown = true;

  const wasBackendUnreachable = !isBackendReachable;
  isBackendReachable = true;

  if (wasBackendUnreachable) {
    notifyOfflineStatusListeners();
  }

  // HTTP is back while the profile subscription dot is offline — retry WS from attempt 0.
  if (wasBackendUnreachable || isGeneralUpdatesSubscriptionOffline()) {
    resetSubscriptionRetryFromStart();
  }
}

export function markBackendUnreachable(): void {
  isBackendReachabilityKnown = true;

  if (isBackendReachable) {
    isBackendReachable = false;
    offlineBannerDismissed = false;
    notifyOfflineBannerDismissListeners();
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

function syncBrowserOfflineStatus(nextOffline: boolean): void {
  if (nextOffline !== isBrowserOffline) {
    isBrowserOffline = nextOffline;
    notifyOfflineStatusListeners();
  }
}

function handleNetworkBackOnline(): void {
  void probeBackendReachability().then((reachable) => {
    if (reachable) {
      markBackendReachable();
    }
  });
}

function registerNativeNetworkListeners(): void {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  void Network.getStatus()
    .then((status) => {
      syncBrowserOfflineStatus(!status.connected);
    })
    .catch((error: unknown) => {
      console.warn("[Offline] Failed to read native network status.", error);
    });

  void Network.addListener("networkStatusChange", (status) => {
    syncBrowserOfflineStatus(!status.connected);
    if (status.connected) {
      handleNetworkBackOnline();
    }
  });
}

export function initBrowserOfflineListeners(): void {
  if (offlineListenersRegistered || typeof window === "undefined") {
    return;
  }

  offlineListenersRegistered = true;

  const syncFromNavigator = (): void => {
    syncBrowserOfflineStatus(!navigator.onLine);
  };

  window.addEventListener("online", () => {
    syncFromNavigator();
    handleNetworkBackOnline();
  });
  window.addEventListener("offline", syncFromNavigator);
  registerNativeNetworkListeners();
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

    const response = await fetch(resolveGraphqlHttpUrl(), {
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
