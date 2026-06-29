import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useEffect, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { subscribePushNotificationOpen } from "../lib/push-open-listeners";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";
import { PRODUCTS_ROUTE_PATH_PREFIX } from "../routing/product-route-path";
import {
  consumePendingPushNotificationOpen,
  handleNativeNotificationDeepLink,
  handleNativePushNotificationTap,
  handlePushNotificationOpenMessage,
} from "../utils/pushNotificationOpen.util";

function isNotificationDeepLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return (
      parsed.pathname.startsWith("/notifications") ||
      parsed.pathname.startsWith(PRODUCTS_ROUTE_PATH_PREFIX)
    );
  } catch {
    return trimmed.startsWith("/notifications") || trimmed.startsWith(PRODUCTS_ROUTE_PATH_PREFIX);
  }
}

/**
 * Listens for push-click payloads (web service worker and native Android), navigates
 * to the notifications page, and replays any pending open notification after a cold start.
 */
export function PushNotificationOpenHost(): ReactElement | null {
  const navigate = useNavigate();

  useEffect(() => {
    return subscribePushNotificationOpen(() => {
      navigate(APP_SHELL_ROUTES.notifications);
    });
  }, [navigate]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent): void => {
      handlePushNotificationOpenMessage(event);
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    void consumePendingPushNotificationOpen();

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = (url: string): void => {
      if (!isNotificationDeepLink(url)) {
        return;
      }

      handleNativeNotificationDeepLink(url);
    };

    void App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleDeepLink(result.url);
      }
    });

    let removeAppUrlOpen: (() => void) | undefined;
    void App.addListener("appUrlOpen", (event) => {
      handleDeepLink(event.url);
    }).then((handle) => {
      removeAppUrlOpen = () => {
        void handle.remove();
      };
    });

    let removePushAction: (() => void) | undefined;
    void PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      handleNativePushNotificationTap(action.notification);
    }).then((handle) => {
      removePushAction = () => {
        void handle.remove();
      };
    });

    return () => {
      removeAppUrlOpen?.();
      removePushAction?.();
    };
  }, []);

  return null;
}
