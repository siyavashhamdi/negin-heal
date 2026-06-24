import { useCallback, useEffect, useState } from "react";

import { getBrowserNotificationPermission } from "../utils/browserNotification.util";

export type BrowserNotificationPermissionState = NotificationPermission | "unsupported";

export function useBrowserNotificationPermission(): {
  readonly permission: BrowserNotificationPermissionState;
  readonly refreshPermission: () => void;
} {
  const [permission, setPermission] = useState<BrowserNotificationPermissionState>(() =>
    getBrowserNotificationPermission()
  );

  const syncPermission = useCallback((): void => {
    setPermission(getBrowserNotificationPermission());
  }, []);

  useEffect(() => {
    let disposed = false;
    let permissionStatus: PermissionStatus | null = null;

    const attachPermissionListener = async (): Promise<void> => {
      if (!("permissions" in navigator)) {
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({
          name: "notifications" as PermissionName,
        });

        if (disposed) {
          return;
        }

        permissionStatus.onchange = syncPermission;
        syncPermission();
      } catch {
        // Permissions API may be unavailable for notifications on some browsers.
      }
    };

    void attachPermissionListener();
    syncPermission();

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        syncPermission();
      }
    };

    window.addEventListener("focus", syncPermission);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;

      if (permissionStatus) {
        permissionStatus.onchange = null;
      }

      window.removeEventListener("focus", syncPermission);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncPermission]);

  return { permission, refreshPermission: syncPermission };
}
