import { Capacitor, registerPlugin } from "@capacitor/core";

import { isAndroidApp } from "../utils/androidAppDownload.util";

interface LauncherBadgePlugin {
  setCount(options: { count: number }): Promise<void>;
  clear(): Promise<void>;
}

const LauncherBadge = registerPlugin<LauncherBadgePlugin>("LauncherBadge");

function isNativeAndroidShell(): boolean {
  return isAndroidApp() && Capacitor.getPlatform() === "android";
}

export async function syncLauncherBadgeCount(count: number): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  try {
    const normalizedCount = Math.max(0, Math.floor(count));

    if (normalizedCount <= 0) {
      await LauncherBadge.clear();
      return;
    }

    await LauncherBadge.setCount({ count: normalizedCount });
  } catch (error) {
    console.warn("[LauncherBadge] Failed to sync launcher badge count.", error);
  }
}

export async function clearLauncherBadgeCount(): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  try {
    await LauncherBadge.clear();
  } catch (error) {
    console.warn("[LauncherBadge] Failed to clear launcher badge count.", error);
  }
}
