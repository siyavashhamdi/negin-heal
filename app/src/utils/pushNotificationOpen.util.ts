import {
  CONSUME_PUSH_OPEN_MESSAGE_TYPE,
  PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
  PUSH_OPEN_CACHE_KEY,
  PUSH_OPEN_CACHE_NAME,
} from "../constants/push-notification-open.constants";
import { notifyPushNotificationOpenListeners } from "../lib/push-open-listeners";
import { markNotificationListRefetchPending } from "../lib/notification-list-refetch-listeners";
import { notifyBadgeCountUpdateListeners } from "../lib/badge-count-update-listeners";
import type { PushNotificationOpenPayload } from "../types/push-notification-open.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function normalizePushNotificationOpenPayload(
  value: unknown
): PushNotificationOpenPayload | null {
  if (!isRecord(value) || value.type !== PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE) {
    return null;
  }

  const description =
    typeof value.description === "string" && value.description.trim().length > 0
      ? value.description.trim()
      : typeof value.body === "string" && value.body.trim().length > 0
        ? value.body.trim()
        : "";

  if (!description) {
    return null;
  }

  const title =
    typeof value.inAppTitle === "string" && value.inAppTitle.trim().length > 0
      ? value.inAppTitle.trim()
      : typeof value.title === "string" && value.title.trim().length > 0
        ? value.title.trim()
        : undefined;

  return {
    type: PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
    notificationId: typeof value.notificationId === "string" ? value.notificationId : undefined,
    title,
    description,
    messageType: typeof value.messageType === "string" ? value.messageType : undefined,
    mode: typeof value.mode === "string" ? value.mode : undefined,
    productId: typeof value.productId === "string" ? value.productId : undefined,
    chapterKey: typeof value.chapterKey === "string" ? value.chapterKey : undefined,
    action: isRecord(value.action) ? value.action : undefined,
    actionLabel: typeof value.actionLabel === "string" ? value.actionLabel : undefined,
    actionUrl: typeof value.actionUrl === "string" ? value.actionUrl : undefined,
  };
}

async function readPendingPushOpenFromCache(): Promise<PushNotificationOpenPayload | null> {
  if (!("caches" in window)) {
    return null;
  }

  try {
    const cache = await caches.open(PUSH_OPEN_CACHE_NAME);
    const response = await cache.match(PUSH_OPEN_CACHE_KEY);
    if (!response) {
      return null;
    }

    await cache.delete(PUSH_OPEN_CACHE_KEY);
    const parsed: unknown = await response.json();
    return normalizePushNotificationOpenPayload(parsed);
  } catch {
    return null;
  }
}

async function requestPendingPushOpenFromServiceWorker(): Promise<PushNotificationOpenPayload | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const activeWorker = registration.active;
    if (!activeWorker) {
      return null;
    }

    return await new Promise<PushNotificationOpenPayload | null>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        cleanup();
        resolve(null);
      }, 1500);

      const handleMessage = (event: MessageEvent): void => {
        const payload = normalizePushNotificationOpenPayload(event.data);
        if (!payload) {
          return;
        }

        cleanup();
        resolve(payload);
      };

      const cleanup = (): void => {
        window.clearTimeout(timeoutId);
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);
      activeWorker.postMessage({ type: CONSUME_PUSH_OPEN_MESSAGE_TYPE });
    });
  } catch {
    return null;
  }
}

function dispatchPushNotificationOpenPayload(payload: PushNotificationOpenPayload): void {
  notifyPushNotificationOpenListeners(payload);
  markNotificationListRefetchPending();
  notifyBadgeCountUpdateListeners();
}

export function handleNativeNotificationDeepLink(url: string): void {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return;
  }

  dispatchPushNotificationOpenPayload({
    type: PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
    description: "اعلان جدید",
  });
}

export function handleNativePushNotificationTap(notification: {
  readonly title?: string;
  readonly body?: string;
  readonly data?: Record<string, unknown>;
}): void {
  const data = notification.data ?? {};
  const description =
    typeof notification.body === "string" && notification.body.trim().length > 0
      ? notification.body.trim()
      : typeof notification.title === "string" && notification.title.trim().length > 0
        ? notification.title.trim()
        : "اعلان جدید";

  const payload =
    normalizePushNotificationOpenPayload({
      type: PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
      title: notification.title,
      body: notification.body,
      description,
      notificationId: typeof data.notificationId === "string" ? data.notificationId : undefined,
      messageType: typeof data.messageType === "string" ? data.messageType : undefined,
      mode: typeof data.mode === "string" ? data.mode : undefined,
      productId: typeof data.productId === "string" ? data.productId : undefined,
      chapterKey: typeof data.chapterKey === "string" ? data.chapterKey : undefined,
      actionLabel: typeof data.actionLabel === "string" ? data.actionLabel : undefined,
      actionUrl: typeof data.actionUrl === "string" ? data.actionUrl : undefined,
    }) ??
    ({
      type: PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
      description,
    } satisfies PushNotificationOpenPayload);

  dispatchPushNotificationOpenPayload(payload);
}

export function handlePushNotificationOpenMessage(event: MessageEvent): void {
  const payload = normalizePushNotificationOpenPayload(event.data);
  if (!payload) {
    return;
  }

  dispatchPushNotificationOpenPayload(payload);
}

export async function consumePendingPushNotificationOpen(): Promise<void> {
  const cachedPayload = await readPendingPushOpenFromCache();
  if (cachedPayload) {
    dispatchPushNotificationOpenPayload(cachedPayload);
    return;
  }

  const workerPayload = await requestPendingPushOpenFromServiceWorker();
  if (workerPayload) {
    dispatchPushNotificationOpenPayload(workerPayload);
  }
}
