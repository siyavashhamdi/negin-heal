import { Badge } from "@capawesome/capacitor-badge";
import { Capacitor } from "@capacitor/core";

import { isAndroidApp } from "../utils/androidAppDownload.util";

function isNativeAndroidShell(): boolean {
  return isAndroidApp() && Capacitor.getPlatform() === "android";
}

export async function syncLauncherBadgeCount(count: number): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  try {
    const { isSupported } = await Badge.isSupported();
    if (!isSupported) {
      return;
    }

    const permission = await Badge.checkPermissions();
    if (permission.display !== "granted") {
      const requested = await Badge.requestPermissions();
      if (requested.display !== "granted") {
        return;
      }
    }

    const normalizedCount = Math.max(0, Math.floor(count));

    if (normalizedCount <= 0) {
      await Badge.clear();
      return;
    }

    await Badge.set({ count: normalizedCount });
  } catch (error) {
    console.warn("[LauncherBadge] Failed to sync launcher badge count.", error);
  }
}

export async function clearLauncherBadgeCount(): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  try {
    const { isSupported } = await Badge.isSupported();
    if (!isSupported) {
      return;
    }

    await Badge.clear();
  } catch (error) {
    console.warn("[LauncherBadge] Failed to clear launcher badge count.", error);
  }
}
