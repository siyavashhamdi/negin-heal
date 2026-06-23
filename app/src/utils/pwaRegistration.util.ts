import { registerSW } from "virtual:pwa-register";

const LEGACY_PUSH_SW_FILENAME = "push-sw.js";

type NeedRefreshListener = () => void;
type ApplyServiceWorkerUpdate = (reloadPage?: boolean) => Promise<void>;

let activeRegistration: ServiceWorkerRegistration | undefined;
let applyServiceWorkerUpdate: ApplyServiceWorkerUpdate | undefined;
let updateAvailablePending = false;
const needRefreshListeners = new Set<NeedRefreshListener>();

function getRegistrationScriptUrls(registration: ServiceWorkerRegistration): string[] {
  return [registration.active, registration.waiting, registration.installing]
    .filter((worker): worker is ServiceWorker => worker != null)
    .map((worker) => worker.scriptURL);
}

function notifyNeedRefresh(): void {
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
          scriptUrl.includes(LEGACY_PUSH_SW_FILENAME),
        ),
      )
      .map((registration) => registration.unregister()),
  );
}

export function subscribeAppUpdateAvailable(listener: NeedRefreshListener): () => void {
  needRefreshListeners.add(listener);

  if (updateAvailablePending) {
    listener();
    updateAvailablePending = false;
  }

  return () => {
    needRefreshListeners.delete(listener);
  };
}

export function applyAppUpdate(): void {
  void (async () => {
    try {
      await applyServiceWorkerUpdate?.(true);
    } finally {
      window.location.reload();
    }
  })();
}

function watchForWaitingServiceWorker(registration: ServiceWorkerRegistration): void {
  const notifyIfWaiting = (): void => {
    if (registration.waiting) {
      notifyNeedRefresh();
    }
  };

  notifyIfWaiting();

  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) {
      return;
    }

    installingWorker.addEventListener("statechange", notifyIfWaiting);
  });
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
          watchForWaitingServiceWorker(registration);
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
