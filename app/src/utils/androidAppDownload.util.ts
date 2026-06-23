const ANDROID_APP_DOWNLOAD_PATH = "/app/negin-heal.apk";
const ANDROID_APP_NO_CHROME_DOWNLOAD_PATH = "/app/negin-heal-no-chrome.apk";

type WindowWithNativeBridge = Window & {
  readonly Capacitor?: { readonly getPlatform?: () => string };
  readonly ReactNativeWebView?: unknown;
};

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent);
}

function isAndroidApp(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const windowWithBridge = window as WindowWithNativeBridge;
  const capacitorPlatform = windowWithBridge.Capacitor?.getPlatform?.().toLowerCase();

  if (capacitorPlatform === "android") {
    return true;
  }

  if (windowWithBridge.ReactNativeWebView) {
    return true;
  }

  const userAgent = navigator.userAgent;
  return /; wv\)/i.test(userAgent) || /\bWebView\b/i.test(userAgent);
}

export function shouldShowAndroidAppDownloadLink(): boolean {
  return isAndroidDevice() && !isAndroidApp();
}

export function getAndroidAppDownloadUrl(): string {
  return ANDROID_APP_DOWNLOAD_PATH;
}

export function getAndroidAppNoChromeDownloadUrl(): string {
  return ANDROID_APP_NO_CHROME_DOWNLOAD_PATH;
}
