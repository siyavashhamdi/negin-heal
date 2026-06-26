import { Capacitor } from "@capacitor/core";
import { useEffect, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { subscribePushNotificationOpen } from "../lib/push-open-listeners";
import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";
import {
  consumePendingPushNotificationOpen,
  handlePushNotificationOpenMessage,
} from "../utils/pushNotificationOpen.util";

/**
 * Listens for service-worker push-click payloads, navigates to the notifications
 * page, and replays any pending open notification after a cold start.
 */
export function PushNotificationOpenHost(): ReactElement | null {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform() || !("serviceWorker" in navigator)) {
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
    if (Capacitor.isNativePlatform()) {
      return;
    }

    return subscribePushNotificationOpen(() => {
      navigate(APP_SHELL_ROUTES.notifications);
    });
  }, [navigate]);

  return null;
}
