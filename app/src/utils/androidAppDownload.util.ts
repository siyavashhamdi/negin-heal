const ANDROID_APP_DOWNLOAD_PATH = "/app/negin-heal.apk";

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
