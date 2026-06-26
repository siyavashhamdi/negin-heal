import { registerSW } from "virtual:pwa-register";

const LEGACY_PUSH_SW_FILENAME = "push-sw.js";
const SESSION_APP_UPDATE_RELOADING_KEY = "negin-heal:app-update-reloading";
/** Fallback when skipWaiting/activation does not reload within this window. */
const APP_UPDATE_RELOAD_FALLBACK_MS = 4_000;

type NeedRefreshListener = () => void;
type ApplyServiceWorkerUpdate = (reloadPage?: boolean) => Promise<void>;

let activeRegistration: ServiceWorkerRegistration | undefined;
let applyServiceWorkerUpdate: ApplyServiceWorkerUpdate | undefined;
let updateAvailablePending = false;
let updateApplying = false;
const needRefreshListeners = new Set<NeedRefreshListener>();

function getRegistrationScriptUrls(registration: ServiceWorkerRegistration): string[] {
  return [registration.active, registration.waiting, registration.installing]
    .filter((worker): worker is ServiceWorker => worker != null)
    .map((worker) => worker.scriptURL);
}

function readJustReloadedForUpdate(): boolean {
  try {
    const justReloaded = sessionStorage.getItem(SESSION_APP_UPDATE_RELOADING_KEY) === "1";
    if (justReloaded) {
      sessionStorage.removeItem(SESSION_APP_UPDATE_RELOADING_KEY);
    }
    return justReloaded;
  } catch {
    return false;
  }
}

function markReloadingForUpdate(): void {
  try {
    sessionStorage.setItem(SESSION_APP_UPDATE_RELOADING_KEY, "1");
  } catch {
    // Best effort only.
  }
}

function notifyNeedRefresh(): void {
  if (updateApplying) {
    return;
  }

  if (needRefreshListeners.size === 0) {
    updateAvailablePending = true;
    return;
  }

  for (const listener of needRefreshListeners) {
    listener();
  }
}

async function unregisterLegacyPushServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations
      .filter((registration) =>
        getRegistrationScriptUrls(registration).some((scriptUrl) =>
          scriptUrl.includes(LEGACY_PUSH_SW_FILENAME)
        )
      )
      .map((registration) => registration.unregister())
  );
}

export function subscribeAppUpdateAvailable(listener: NeedRefreshListener): () => void {
  needRefreshListeners.add(listener);

  if (readJustReloadedForUpdate()) {
    updateAvailablePending = false;
    return () => {
      needRefreshListeners.delete(listener);
    };
  }

  if (updateAvailablePending) {
    listener();
    updateAvailablePending = false;
  }

  return () => {
    needRefreshListeners.delete(listener);
  };
}

/**
 * Activates the waiting service worker and reloads once.
 * vite-plugin-pwa (prompt mode) reloads on Workbox "controlling"; we only add a
 * timed fallback — never unregister workers or wipe caches here (that caused
 * white screens and repeated update prompts).
 */
export function applyAppUpdate(): void {
  if (updateApplying) {
    return;
  }

  updateApplying = true;
  updateAvailablePending = false;
  markReloadingForUpdate();

  void (async () => {
    let reloaded = false;

    const reloadOnce = (): void => {
      if (reloaded) {
        return;
      }
      reloaded = true;
      window.location.reload();
    };

    const fallbackTimer = window.setTimeout(reloadOnce, APP_UPDATE_RELOAD_FALLBACK_MS);

    try {
      await applyServiceWorkerUpdate?.();
    } catch {
      window.clearTimeout(fallbackTimer);
      reloadOnce();
    }
  })();
}

export function registerPwaServiceWorker(): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  void unregisterLegacyPushServiceWorkers().finally(() => {
    applyServiceWorkerUpdate = registerSW({
      immediate: true,
      onNeedRefresh() {
        notifyNeedRefresh();
      },
      onRegistered(registration) {
        if (registration) {
          activeRegistration = registration;
          window.dispatchEvent(new Event("negin-heal:sw-ready"));
        }
      },
      onRegisterError(error) {
        console.error("[PWA] Service worker registration failed:", error);
      },
    });
  });
}

export async function getPwaServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    if (activeRegistration) {
      return activeRegistration;
    }

    await navigator.serviceWorker.ready;
    return (await navigator.serviceWorker.getRegistration("/")) ?? null;
  } catch {
    return null;
  }
}
