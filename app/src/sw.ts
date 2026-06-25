/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { CacheFirst } from "workbox-strategies";
import { NavigationRoute, registerRoute } from "workbox-routing";

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
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request, url }) => request.destination === "wasm" || url.pathname.endsWith(".wasm"),
  new CacheFirst({
    cacheName: "wasm-runtime-cache",
  })
);

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(self.skipWaiting());
});

const navigationHandler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(navigationHandler, { denylist: NAVIGATION_DENYLIST }));

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(clientsClaim());
});

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {
    title: "نگین هیل",
    body: "اعلان جدیدی برای شما ثبت شد.",
    url: "/",
    tag: "negin-heal-push",
    notificationId: undefined,
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: payload.tag || "negin-heal-push",
    data: {
      url: payload.url || "/",
      notificationId: payload.notificationId,
    },
    dir: "rtl",
    lang: "fa",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

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

        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absoluteUrl);
      }
    })
  );
});
