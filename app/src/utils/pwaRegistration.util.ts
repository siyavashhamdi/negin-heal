import { registerSW } from "virtual:pwa-register";

const LEGACY_PUSH_SW_FILENAME = "push-sw.js";

let activeRegistration: ServiceWorkerRegistration | undefined;

async function unregisterLegacyPushServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations
      .filter((registration) =>
        Array.from(registration.scriptURLs).some((scriptUrl) =>
          scriptUrl.includes(LEGACY_PUSH_SW_FILENAME),
        ),
      )
      .map((registration) => registration.unregister()),
  );
}

export function registerPwaServiceWorker(): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  void unregisterLegacyPushServiceWorkers().finally(() => {
    registerSW({
      immediate: true,
      onRegistered(registration) {
        activeRegistration = registration;
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
