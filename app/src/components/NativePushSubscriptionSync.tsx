import { useEffect, type ReactElement } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBrowserNotificationPermission } from "../hooks/useBrowserNotificationPermission";
import { useMe } from "../hooks/useMe";
import { syncNativePushRegistrationWithServer } from "../native/nativePushRegistration";
import { readStoredNotificationsEnabled } from "../utils/userPreferences.util";

/**
 * Registers the Android APK FCM token with the API so the server can sync
 * launcher badge counts and deliver native notifications while the app is closed.
 */
export function NativePushSubscriptionSync(): ReactElement | null {
  const { isAuthenticated } = useAuth();
  const { user } = useMe();
  const { permission } = useBrowserNotificationPermission();
  const notificationsEnabled = readStoredNotificationsEnabled(
    user?.preferences?.notificationsEnabled ?? true
  );

  useEffect(() => {
    if (!isAuthenticated || permission !== "granted" || !notificationsEnabled) {
      return;
    }

    void syncNativePushRegistrationWithServer();
  }, [isAuthenticated, notificationsEnabled, permission, user?.id]);

  return null;
}
