import { useEffect, type ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBrowserNotificationPermission } from "../hooks/useBrowserNotificationPermission";
import { useMe } from "../hooks/useMe";
import { readStoredNotificationsEnabled } from "../utils/userPreferences.util";
import { syncWebPushSubscriptionWithServer } from "../utils/pushSubscription.util";

/**
 * Ensures the browser Web Push subscription is registered with the API
 * whenever the user is authenticated, notifications are enabled, and
 * browser permission is granted (login, session restore, preference changes).
 */
export function PushSubscriptionSync(): ReactElement | null {
  const { isAuthenticated } = useAuth();
  const { user } = useMe();
  const { permission } = useBrowserNotificationPermission();
  const notificationsEnabled = readStoredNotificationsEnabled(
    user?.preferences?.notificationsEnabled ?? true,
  );

  useEffect(() => {
    if (!isAuthenticated || permission !== "granted" || !notificationsEnabled) {
      return;
    }

    void syncWebPushSubscriptionWithServer();

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const retryOnServiceWorkerReady = (): void => {
      void syncWebPushSubscriptionWithServer();
    };

    void navigator.serviceWorker.ready.then(retryOnServiceWorkerReady).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", retryOnServiceWorkerReady);
    window.addEventListener("negin-heal:sw-ready", retryOnServiceWorkerReady);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", retryOnServiceWorkerReady);
      window.removeEventListener("negin-heal:sw-ready", retryOnServiceWorkerReady);
    };
  }, [isAuthenticated, notificationsEnabled, permission, user?.id]);

  return null;
}
