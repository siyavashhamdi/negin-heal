import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { PWA_THEME_COLOR } from "../constants/pwa.constants";
import { bootstrapNativePushAndBadge } from "./nativePushRegistration";
import { registerNativeBackButtonListener } from "./nativeBackButton";
import { applyNativeSafeAreaInsets } from "./nativeSafeArea";
import { registerNativeKeyboardScrollBehavior } from "./nativeKeyboardScroll";
import { isNativeAndroidShell } from "../utils/nativePlatform.util";

async function configureAndroidChrome(): Promise<void> {
  await applyNativeSafeAreaInsets();
  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: PWA_THEME_COLOR });
}

/**
 * Initializes native Android shell behavior when the app runs inside Capacitor.
 * Safe to call on web builds — it no-ops outside the native shell.
 */
export async function bootstrapCapacitorNativeShell(): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  registerNativeBackButtonListener();
  registerNativeKeyboardScrollBehavior();

  try {
    void configureAndroidChrome();
    await SplashScreen.hide();
    void bootstrapNativePushAndBadge();
  } catch (error) {
    console.error("[Capacitor] Native shell bootstrap failed:", error);
  }
}
