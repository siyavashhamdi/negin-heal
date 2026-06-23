import { isAndroidApp, isAndroidDevice } from "./androidAppDownload.util";
import { isInstalledPwa } from "./iosHomeScreenInstall.util";

export function isAndroidChromeBrowser(): boolean {
  if (!isAndroidDevice() || isAndroidApp()) {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /Chrome/i.test(userAgent) && !/EdgA|OPR|SamsungBrowser|Firefox/i.test(userAgent);
}

export function shouldShowAndroidHomeScreenInstallPrompt(): boolean {
  // Browser-only: never show inside the native Capacitor APK or an installed PWA shortcut.
  return isAndroidDevice() && !isAndroidApp() && !isInstalledPwa();
}
