import { registerSW } from "virtual:pwa-register";

const LEGACY_PUSH_SW_FILENAME = "push-sw.js";
const SESSION_APP_UPDATE_RELOADING_KEY = "negin-heal:app-update-reloading";
/**
 * Marks the tab's initial load window. While unset, a waiting SW update for a
 * returning visitor is applied silently (cold start). After it ends, updates
 * show the banner only (mid-session) — never auto-refresh.
 */
const SESSION_INITIAL_LOAD_PHASE_KEY = "negin-heal:session-initial-load";
/** Fallback when skipWaiting/activation does not reload within this window. */
const APP_UPDATE_RELOAD_FALLBACK_MS = 4_000;
/**
 * After SW registration, allow the immediate update check to finish before
 * ending the initial-load phase or treating a waiting worker as user-facing.
 */
const REGISTRATION_SETTLE_MS = 2_500;

type NeedRefreshListener = () => void;
type ApplyServiceWorkerUpdate = (reloadPage?: boolean) => Promise<void>;

let activeRegistration: ServiceWorkerRegistration | undefined;
let applyServiceWorkerUpdate: ApplyServiceWorkerUpdate | undefined;
let updateAvailablePending = false;
let updateApplying = false;
let isReturningVisitor = false;
let initialRegistrationSettled = false;
let ignoredWaitingWorker: ServiceWorker | null = null;
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

function isInitialLoadPhase(): boolean {
  try {
    return sessionStorage.getItem(SESSION_INITIAL_LOAD_PHASE_KEY) !== "done";
  } catch {
    return true;
  }
}

function endInitialLoadPhase(): void {
  try {
    sessionStorage.setItem(SESSION_INITIAL_LOAD_PHASE_KEY, "done");
  } catch {
    // Best effort only.
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function detectReturningVisitor(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  if (navigator.serviceWorker.controller) {
    return true;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return registration?.active != null;
  } catch {
    return false;
  }
}

async function resolveActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (activeRegistration) {
    return activeRegistration;
  }

  try {
    return (await navigator.serviceWorker.getRegistration("/")) ?? null;
  } catch {
    return null;
  }
}

/**
 * A real SW update: a newer worker is waiting while an older one is still active,
 * and first-visit false positives are filtered out.
 */
function isEligibleWaitingUpdate(registration: ServiceWorkerRegistration): boolean {
  if (!registration.waiting || !registration.active) {
    return false;
  }

  if (isReturningVisitor) {
    return true;
  }

  if (!initialRegistrationSettled) {
    return false;
  }

  if (ignoredWaitingWorker && registration.waiting === ignoredWaitingWorker) {
    return false;
  }

  return true;
}

function shouldShowUpdateBanner(registration: ServiceWorkerRegistration): boolean {
  return isEligibleWaitingUpdate(registration) && !isInitialLoadPhase();
}

function shouldSilentlyAutoApply(registration: ServiceWorkerRegistration): boolean {
  return (
    isReturningVisitor &&
    (isInitialLoadPhase() || !initialRegistrationSettled) &&
    isEligibleWaitingUpdate(registration) &&
    !readJustReloadedForUpdate()
  );
}

function dispatchNeedRefresh(): void {
  if (needRefreshListeners.size === 0) {
    updateAvailablePending = true;
    return;
  }

  for (const listener of needRefreshListeners) {
    listener();
  }
}

async function handleServiceWorkerUpdate(): Promise<void> {
  if (updateApplying) {
    return;
  }

  const registration = await resolveActiveRegistration();
  if (!registration || !isEligibleWaitingUpdate(registration)) {
    return;
  }

  if (shouldSilentlyAutoApply(registration)) {
    endInitialLoadPhase();
    applyAppUpdate();
    return;
  }

  if (shouldShowUpdateBanner(registration)) {
    dispatchNeedRefresh();
  }
}

async function waitForRegistrationSettle(registration: ServiceWorkerRegistration): Promise<void> {
  await delay(REGISTRATION_SETTLE_MS);

  const installDeadline = Date.now() + REGISTRATION_SETTLE_MS;
  while (registration.installing && Date.now() < installDeadline) {
    await delay(250);
  }
}

async function waitForInstallingWorker(
  registration: ServiceWorkerRegistration,
  maxMs: number
): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (registration.installing && Date.now() < deadline) {
    await delay(250);
  }
}

async function completeInitialRegistration(registration: ServiceWorkerRegistration): Promise<void> {
  if (isReturningVisitor) {
    await waitForRegistrationSettle(registration);

    try {
      await registration.update();
    } catch {
      // Offline or transient errors — continue with any already-waiting worker.
    }

    await waitForInstallingWorker(registration, REGISTRATION_SETTLE_MS * 2);

    if (!updateApplying && isInitialLoadPhase()) {
      await handleServiceWorkerUpdate();
      if (updateApplying) {
        return;
      }
    }

    initialRegistrationSettled = true;
    endInitialLoadPhase();
    return;
  }

  try {
    await navigator.serviceWorker.ready;
  } catch {
    // Continue to the settle window even when ready rejects.
  }

  await waitForRegistrationSettle(registration);

  ignoredWaitingWorker = registration.waiting ?? null;
  initialRegistrationSettled = true;
  endInitialLoadPhase();
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
    updateAvailablePending = false;
    void (async () => {
      const registration = await resolveActiveRegistration();
      if (registration && shouldShowUpdateBanner(registration)) {
        listener();
      }
    })();
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

function watchForWaitingServiceWorker(registration: ServiceWorkerRegistration): void {
  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) {
      return;
    }

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state !== "installed" || !registration.waiting) {
        return;
      }

      void handleServiceWorkerUpdate();
    });
  });
}

export function registerPwaServiceWorker(): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  void (async () => {
    isReturningVisitor = await detectReturningVisitor();
    await unregisterLegacyPushServiceWorkers();

    applyServiceWorkerUpdate = registerSW({
      immediate: true,
      onNeedRefresh() {
        void handleServiceWorkerUpdate();
      },
      onRegistered(registration) {
        if (registration) {
          activeRegistration = registration;
          watchForWaitingServiceWorker(registration);
          void completeInitialRegistration(registration);
          window.dispatchEvent(new Event("negin-heal:sw-ready"));
        }
      },
      onRegisterError(error) {
        console.error("[PWA] Service worker registration failed:", error);
      },
    });
  })();
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
