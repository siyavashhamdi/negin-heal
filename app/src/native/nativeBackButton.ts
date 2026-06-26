import { App } from "@capacitor/app";
import { startTransition } from "react";

import { isNativeAndroidShell } from "../utils/nativePlatform.util";

type NativeBackAction = () => void;

let backAction: NativeBackAction | null = null;
let listenerRegistered = false;

export function setNativeBackAction(action: NativeBackAction | null): void {
  backAction = action;
}

export function registerNativeBackButtonListener(): void {
  if (!isNativeAndroidShell() || listenerRegistered) {
    return;
  }

  listenerRegistered = true;

  void App.addListener("backButton", () => {
    if (!backAction) {
      void App.minimizeApp();
      return;
    }

    startTransition(() => {
      backAction?.();
    });
  });
}
