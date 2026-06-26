import { StatusBar } from "@capacitor/status-bar";

/**
 * Configures the Android status bar so WebView content starts below system bars.
 * Layout insets are handled natively (MainActivity + overlaysWebView=false).
 * Do not add CSS body padding — it doubles the gap and shows as a white strip.
 */
export async function applyNativeSafeAreaInsets(): Promise<void> {
  document.documentElement.dataset.nativeAndroidShell = "true";

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (error) {
    console.warn("[Capacitor] Failed to configure status bar overlay.", error);
  }
}
