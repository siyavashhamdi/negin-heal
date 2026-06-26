import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { PWA_THEME_COLOR } from "../constants/pwa.constants";
import { bootstrapNativePushAndBadge } from "./nativePushRegistration";
import { applyNativeSafeAreaInsets } from "./nativeSafeArea";

function isNativeAndroidShell(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

async function configureAndroidChrome(): Promise<void> {
  await applyNativeSafeAreaInsets();
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: PWA_THEME_COLOR });
}

function registerAndroidBackButtonHandler(): void {
  void App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }

    void App.minimizeApp();
  });
}

/**
 * Initializes native Android shell behavior when the app runs inside Capacitor.
 * Safe to call on web builds — it no-ops outside the native shell.
 */
export async function bootstrapCapacitorNativeShell(): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  try {
    await configureAndroidChrome();
    registerAndroidBackButtonHandler();
    await bootstrapNativePushAndBadge();
    await SplashScreen.hide();
  } catch (error) {
    console.error("[Capacitor] Native shell bootstrap failed:", error);
  }
}
