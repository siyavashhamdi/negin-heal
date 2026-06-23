const ANDROID_APP_DOWNLOAD_PATH = "/app/negin-heal.apk";

type WindowWithNativeBridge = Window & {
  readonly Capacitor?: {
    readonly getPlatform?: () => string;
    readonly isNativePlatform?: () => boolean;
  };
  readonly ReactNativeWebView?: unknown;
};

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent);
}

/** True when running inside the native Capacitor APK (not Chrome / mobile browser). */
export function isAndroidApp(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const windowWithBridge = window as WindowWithNativeBridge;
  const capacitor = windowWithBridge.Capacitor;
  const capacitorPlatform = capacitor?.getPlatform?.().toLowerCase();

  if (capacitor?.isNativePlatform?.() && capacitorPlatform === "android") {
    return true;
  }

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
