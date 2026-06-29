import { LOCAL_STORAGE_KEYS } from "../constants";
import { PWA_ICON_192 } from "../constants/pwa.constants";
import { getPwaServiceWorkerRegistration } from "./pwaRegistration.util";

export type BrowserNotificationInput = {
  readonly title: string;
  readonly body: string;
  readonly tag?: string;
};

export type NotificationPushPayload = {
  readonly isPushNotification?: boolean;
  readonly messageType?: string;
  readonly productId?: string;
  readonly chapterKey?: string;
  readonly purchaseStatus?: string;
};

function readNotificationsEnabledPreference(fallback = true): boolean {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  if (stored === "true") {
    return true;
  }
  if (stored === "false") {
    return false;
  }
  return fallback;
}

export function isGlobalAnnouncementNotificationPayload(
  payload: NotificationPushPayload | null | undefined
): boolean {
  if (!payload) {
    return false;
  }

  const messageType =
    typeof payload.messageType === "string" ? payload.messageType.toUpperCase() : "";
  const isAnnouncementMessageType = messageType === "POPUP" || messageType === "SNACKBAR";
  if (!isAnnouncementMessageType) {
    return false;
  }

  return !payload.productId && !payload.chapterKey && payload.purchaseStatus === undefined;
}

export function shouldDeliverNotificationPush(
  payload: NotificationPushPayload | null | undefined,
  notificationsEnabled = readNotificationsEnabledPreference()
): boolean {
  if (!notificationsEnabled) {
    return false;
  }

  if (isGlobalAnnouncementNotificationPayload(payload)) {
    return Boolean(payload?.isPushNotification);
  }

  return true;
}

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
  permission: NotificationPermission | "unsupported"
): boolean {
  return permission === "default" || permission === "denied";
}

function ensureNotificationServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  return getPwaServiceWorkerRegistration();
}

export async function registerNotificationServiceWorker(): Promise<boolean> {
  const registration = await ensureNotificationServiceWorkerRegistration();
  return registration != null;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
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

async function showNotificationViaServiceWorker(input: BrowserNotificationInput): Promise<boolean> {
  const registration = await ensureNotificationServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  await registration.showNotification(input.title, {
    body: input.body,
    tag: input.tag,
    icon: PWA_ICON_192,
    badge: PWA_ICON_192,
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
      icon: PWA_ICON_192,
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

export async function deliverNotificationPushIfEnabled(
  input: BrowserNotificationInput,
  payload?: NotificationPushPayload | null
): Promise<boolean> {
  if (!shouldDeliverNotificationPush(payload)) {
    return false;
  }

  if (!isBrowserNotificationDeliverySupported()) {
    return false;
  }

  const permission = getBrowserNotificationPermission();
  if (permission !== "granted") {
    if (permission !== "default") {
      return false;
    }

    const granted = await ensureBrowserNotificationPermission();
    if (!granted) {
      return false;
    }
  }

  return showBrowserNotification(input);
}
