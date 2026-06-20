export type BrowserNotificationInput = {
  readonly title: string;
  readonly body: string;
  readonly tag?: string;
};

const NOTIFICATION_SW_PATH = "/push-sw.js";

export function isSecureBrowserContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function isBrowserNotificationSupported(): boolean {
  return isSecureBrowserContext() && "Notification" in window;
}

export function requiresServiceWorkerForNotifications(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isBrowserNotificationDeliverySupported(): boolean {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  if (requiresServiceWorkerForNotifications()) {
    return "serviceWorker" in navigator;
  }

  return true;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

export function canRequestBrowserNotificationPrompt(
  permission: NotificationPermission | "unsupported",
): boolean {
  return permission === "default" || permission === "denied";
}

async function ensureNotificationServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration("/");

    if (!registration) {
      registration = await navigator.serviceWorker.register(NOTIFICATION_SW_PATH, {
        scope: "/",
      });
    }

    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export async function registerNotificationServiceWorker(): Promise<boolean> {
  const registration = await ensureNotificationServiceWorkerRegistration();
  return registration != null;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted" && requiresServiceWorkerForNotifications()) {
    await registerNotificationServiceWorker();
  }

  return permission;
}

export async function ensureBrowserNotificationPermission(): Promise<boolean> {
  const permission = await requestBrowserNotificationPermission();
  return permission === "granted";
}

async function showNotificationViaServiceWorker(
  input: BrowserNotificationInput,
): Promise<boolean> {
  const registration = await ensureNotificationServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  await registration.showNotification(input.title, {
    body: input.body,
    tag: input.tag,
    icon: "/logo.svg",
    badge: "/logo.svg",
    dir: "rtl",
    lang: "fa",
    data: {
      url: "/",
    },
  } as NotificationOptions);

  return true;
}

function showNotificationViaPageConstructor(input: BrowserNotificationInput): boolean {
  try {
    new Notification(input.title, {
      body: input.body,
      tag: input.tag,
      icon: "/logo.svg",
      dir: "rtl",
      lang: "fa",
    });
    return true;
  } catch {
    return false;
  }
}

export async function showBrowserNotification(input: BrowserNotificationInput): Promise<boolean> {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  if (requiresServiceWorkerForNotifications() || "serviceWorker" in navigator) {
    const shownViaServiceWorker = await showNotificationViaServiceWorker(input);
    if (shownViaServiceWorker) {
      return true;
    }
  }

  return showNotificationViaPageConstructor(input);
}
