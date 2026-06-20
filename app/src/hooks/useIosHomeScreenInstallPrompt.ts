import { useCallback, useEffect, useState } from "react";

import {
  isInstalledPwa,
  isIosDevice,
  shouldShowIosHomeScreenInstallPrompt,
} from "../utils/iosHomeScreenInstall.util";

export function useIosHomeScreenInstallPrompt(): {
  readonly shouldShow: boolean;
  readonly isInstalled: boolean;
  readonly refreshInstallState: () => void;
} {
  const [shouldShow, setShouldShow] = useState(() => shouldShowIosHomeScreenInstallPrompt());
  const [isInstalled, setIsInstalled] = useState(() => isInstalledPwa());

  const refreshInstallState = useCallback((): void => {
    const installed = isInstalledPwa();
    setIsInstalled(installed);
    setShouldShow(isIosDevice() && !installed);
  }, []);

  useEffect(() => {
    refreshInstallState();

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        refreshInstallState();
      }
    };

    window.addEventListener("focus", refreshInstallState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshInstallState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshInstallState]);

  return { shouldShow, isInstalled, refreshInstallState };
}
