/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { CacheFirst } from "workbox-strategies";
import { NavigationRoute, registerRoute } from "workbox-routing";

import {
  CONSUME_PUSH_OPEN_MESSAGE_TYPE,
  PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
  PUSH_NOTIFICATION_TITLE,
  PUSH_OPEN_CACHE_KEY,
  PUSH_OPEN_CACHE_NAME,
} from "./constants/push-notification-open.constants";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const NOTIFICATION_ICON = "/icons/icon-192.png";
const NAVIGATION_DENYLIST = [
  /^\/api(?:\/|$)/,
  /^\/graphql(?:\/|$)/,
  /^\/enamad-trust-logo(?:\/|$)/,
  /^\/sitemap\.xml$/,
  /^\/robots\.txt$/,
];

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  notificationId?: string;
  badgeCount?: number;
  inAppTitle?: string;
  description?: string;
  messageType?: string;
  mode?: string;
  productId?: string;
  chapterKey?: string;
  action?: Record<string, unknown>;
  actionLabel?: string;
  actionUrl?: string;
};

const NOTIFICATIONS_PAGE_PATH = "/notifications";

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request, url }) => request.destination === "wasm" || url.pathname.endsWith(".wasm"),
  new CacheFirst({
    cacheName: "wasm-runtime-cache",
  })
);

const navigationHandler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(navigationHandler, { denylist: NAVIGATION_DENYLIST }));

async function storePendingPushOpen(payload: Record<string, unknown>): Promise<void> {
  const cache = await caches.open(PUSH_OPEN_CACHE_NAME);
  await cache.put(
    PUSH_OPEN_CACHE_KEY,
    new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    })
  );
}

async function takePendingPushOpen(): Promise<Record<string, unknown> | null> {
  try {
    const cache = await caches.open(PUSH_OPEN_CACHE_NAME);
    const response = await cache.match(PUSH_OPEN_CACHE_KEY);
    if (!response) {
      return null;
    }

    await cache.delete(PUSH_OPEN_CACHE_KEY);
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildPushOpenPayload(
  notification: Notification,
  data: PushPayload | null | undefined
): Record<string, unknown> | null {
  const description =
    (typeof data?.description === "string" && data.description.trim()) ||
    (typeof data?.body === "string" && data.body.trim()) ||
    (typeof notification.body === "string" && notification.body.trim()) ||
    "";

  if (!description) {
    return null;
  }

  const inAppTitle =
    typeof data?.inAppTitle === "string" && data.inAppTitle.trim()
      ? data.inAppTitle.trim()
      : undefined;
  const title =
    inAppTitle ||
    (typeof data?.title === "string" && data.title.trim()) ||
    (typeof notification.title === "string" && notification.title.trim()) ||
    undefined;

  const payload: Record<string, unknown> = {
    type: PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE,
    description,
  };

  if (title) {
    payload.title = title;
  }

  if (inAppTitle) {
    payload.inAppTitle = inAppTitle;
  }

  if (typeof data?.notificationId === "string") {
    payload.notificationId = data.notificationId;
  }

  if (typeof data?.messageType === "string") {
    payload.messageType = data.messageType;
  }

  if (typeof data?.mode === "string") {
    payload.mode = data.mode;
  }

  if (typeof data?.productId === "string") {
    payload.productId = data.productId;
  }

  if (typeof data?.chapterKey === "string") {
    payload.chapterKey = data.chapterKey;
  }

  if (data?.action) {
    payload.action = data.action;
  }

  if (typeof data?.actionLabel === "string") {
    payload.actionLabel = data.actionLabel;
  }

  if (typeof data?.actionUrl === "string") {
    payload.actionUrl = data.actionUrl;
  }

  return payload;
}

function deliverPushOpenToClient(client: Client, payload: Record<string, unknown>): void {
  client.postMessage(payload);
}

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === CONSUME_PUSH_OPEN_MESSAGE_TYPE) {
    event.waitUntil(
      takePendingPushOpen().then(async (payload) => {
        if (!payload) {
          return;
        }

        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        for (const client of clients) {
          deliverPushOpenToClient(client, payload);
        }
      })
    );
  }
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(clientsClaim());
});

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {
    title: PUSH_NOTIFICATION_TITLE,
    body: "اعلان جدیدی برای شما ثبت شد.",
    url: "/",
    tag: "negin-heal-push",
    notificationId: undefined,
  };

  if (event.data) {
    try {
      const parsed = event.data.json() as Partial<PushPayload>;
      payload = {
        ...payload,
        ...parsed,
        badgeCount:
          typeof parsed.badgeCount === "number"
            ? parsed.badgeCount
            : typeof parsed.badgeCount === "string"
              ? Number.parseInt(parsed.badgeCount, 10)
              : payload.badgeCount,
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  const showNotificationPromise = self.registration.showNotification(PUSH_NOTIFICATION_TITLE, {
    body: payload.body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: payload.tag || "negin-heal-push",
    data: {
      url: payload.url || "/",
      title: PUSH_NOTIFICATION_TITLE,
      body: payload.body,
      inAppTitle: payload.inAppTitle,
      description: payload.description ?? payload.body,
      notificationId: payload.notificationId,
      badgeCount: payload.badgeCount,
      messageType: payload.messageType,
      mode: payload.mode,
      productId: payload.productId,
      chapterKey: payload.chapterKey,
      action: payload.action,
      actionLabel: payload.actionLabel,
      actionUrl: payload.actionUrl,
    },
    dir: "rtl",
    lang: "fa",
    renotify: true,
  });

  const notifyClientsPromise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      if (typeof payload.badgeCount !== "number" || Number.isNaN(payload.badgeCount)) {
        return;
      }

      clients.forEach((client) => {
        client.postMessage({
          type: "launcher-badge-sync",
          badgeCount: payload.badgeCount,
        });
      });
    });

  event.waitUntil(Promise.all([showNotificationPromise, notifyClientsPromise]));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const notificationData = event.notification?.data as PushPayload | undefined;
  const absoluteUrl = new URL(NOTIFICATIONS_PAGE_PATH, self.location.origin).href;
  const pushOpenPayload = buildPushOpenPayload(event.notification, notificationData);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (!client.url.startsWith(self.location.origin) || !("focus" in client)) {
          continue;
        }

        await client.focus();

        if ("navigate" in client && typeof client.navigate === "function") {
          await client.navigate(absoluteUrl);
        }

        if (pushOpenPayload) {
          deliverPushOpenToClient(client, pushOpenPayload);
        }

        return;
      }

      if (pushOpenPayload) {
        await storePendingPushOpen(pushOpenPayload);
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl);
      }
    })
  );
});
