import { Browser } from "@capacitor/browser";

import { isNativeAndroidShell } from "./nativePlatform.util";

/**
 * Opens a blank tab while the user gesture is still active.
 * Must not use `noopener` here — browsers return null and we lose the reference.
 */
export function prepareExternalUrlTab(): Window | null {
  if (isNativeAndroidShell() || typeof window === "undefined") {
    return null;
  }

  return window.open("about:blank", "_blank");
}

export function openExternalUrlTab(url: string, preparedWindow?: Window | null): boolean {
  if (isNativeAndroidShell()) {
    void Browser.open({ url });
    return true;
  }

  if (preparedWindow && !preparedWindow.closed) {
    preparedWindow.opener = null;
    preparedWindow.location.replace(url);
    return true;
  }

  const openedWindow = window.open(url, "_blank");
  if (openedWindow) {
    openedWindow.opener = null;
    return true;
  }

  return false;
}
