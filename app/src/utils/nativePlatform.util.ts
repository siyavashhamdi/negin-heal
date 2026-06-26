import { Capacitor } from "@capacitor/core";

/** True when running inside the Capacitor Android APK shell. */
export function isNativeAndroidShell(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}
