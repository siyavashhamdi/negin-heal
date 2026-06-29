import { registerPlugin } from "@capacitor/core";

import { isNativeAndroidShell } from "./nativePlatform.util";

interface ExternalUrlPlugin {
  open(options: { url: string }): Promise<void>;
}

const ExternalUrl = registerPlugin<ExternalUrlPlugin>("ExternalUrl");

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

export async function openExternalUrlTab(
  url: string,
  preparedWindow?: Window | null
): Promise<boolean> {
  if (isNativeAndroidShell()) {
    try {
      await ExternalUrl.open({ url });
      return true;
    } catch {
      return false;
    }
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
