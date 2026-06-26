import { App } from "@capacitor/app";
import { useEffect, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { setNativeBackAction } from "../native/nativeBackButton";
import { isNativeAndroidShell } from "../utils/nativePlatform.util";

function canNavigateHistoryBack(): boolean {
  const historyIndex = window.history.state?.idx;
  return typeof historyIndex === "number" && historyIndex > 0;
}

/**
 * Wires the Android hardware back button to React Router navigation.
 */
export function NativeBackButtonBridge(): ReactElement | null {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeAndroidShell()) {
      return;
    }

    setNativeBackAction(() => {
      if (canNavigateHistoryBack()) {
        navigate(-1);
        return;
      }

      void App.minimizeApp();
    });

    return () => {
      setNativeBackAction(null);
    };
  }, [navigate]);

  return null;
}
