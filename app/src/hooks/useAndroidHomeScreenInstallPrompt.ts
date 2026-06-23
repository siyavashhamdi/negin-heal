import { useCallback, useEffect, useRef, useState } from "react";

import { shouldShowAndroidHomeScreenInstallPrompt } from "../utils/androidHomeScreenInstall.util";
import { isInstalledPwa } from "../utils/iosHomeScreenInstall.util";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useAndroidHomeScreenInstallPrompt(): {
  readonly shouldShow: boolean;
  readonly isInstalled: boolean;
  readonly canPromptInstall: boolean;
  readonly promptInstall: () => Promise<void>;
  readonly refreshInstallState: () => void;
} {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [shouldShow, setShouldShow] = useState(() => shouldShowAndroidHomeScreenInstallPrompt());
  const [isInstalled, setIsInstalled] = useState(() => isInstalledPwa());
  const [canPromptInstall, setCanPromptInstall] = useState(false);

  const refreshInstallState = useCallback((): void => {
    const installed = isInstalledPwa();
    setIsInstalled(installed);
    setShouldShow(shouldShowAndroidHomeScreenInstallPrompt());
    setCanPromptInstall(deferredPromptRef.current != null);
  }, []);

  const promptInstall = useCallback(async (): Promise<void> => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPromptRef.current = null;
    setCanPromptInstall(false);
    refreshInstallState();
  }, [refreshInstallState]);

  useEffect(() => {
    refreshInstallState();

    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setCanPromptInstall(true);
    };

    const handleAppInstalled = (): void => {
      deferredPromptRef.current = null;
      setCanPromptInstall(false);
      refreshInstallState();
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        refreshInstallState();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("focus", refreshInstallState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("focus", refreshInstallState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshInstallState]);

  return { shouldShow, isInstalled, canPromptInstall, promptInstall, refreshInstallState };
}
