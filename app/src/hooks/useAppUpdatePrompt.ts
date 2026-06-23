import { useCallback, useEffect, useState } from "react";

import { applyAppUpdate, subscribeAppUpdateAvailable } from "../utils/pwaRegistration.util";

export function useAppUpdatePrompt(): {
  readonly updateAvailable: boolean;
  readonly confirmUpdate: () => void;
  readonly dismissUpdate: () => void;
} {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => subscribeAppUpdateAvailable(() => setUpdateAvailable(true)), []);

  const confirmUpdate = useCallback(() => {
    applyAppUpdate();
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, confirmUpdate, dismissUpdate };
}
