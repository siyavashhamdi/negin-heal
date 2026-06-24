import { useCallback, useEffect, useState } from "react";

import { applyAppUpdate, subscribeAppUpdateAvailable } from "../utils/pwaRegistration.util";

export function useAppUpdatePrompt(): {
  readonly updateAvailable: boolean;
  readonly isApplyingUpdate: boolean;
  readonly confirmUpdate: () => void;
  readonly dismissUpdate: () => void;
} {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => subscribeAppUpdateAvailable(() => setUpdateAvailable(true)), []);

  const confirmUpdate = useCallback(() => {
    setUpdateAvailable(false);
    setIsApplyingUpdate(true);
    applyAppUpdate();
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, isApplyingUpdate, confirmUpdate, dismissUpdate };
}
