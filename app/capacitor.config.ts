import type { CapacitorConfig } from "@capacitor/cli";
import {
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from "./src/constants/pwa.constants";

const PRODUCTION_APP_URL = "https://neginheal.ir";

const config: CapacitorConfig = {
  appId: "neginheal.app",
  appName: "Negin Heal",
  webDir: "dist",
  android: {
    path: "../android",
    minWebViewVersion: 60,
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    url: PRODUCTION_APP_URL,
    cleartext: false,
    androidScheme: "https",
    hostname: "neginheal.ir",
    allowNavigation: ["neginheal.ir", "*.neginheal.ir"],
    errorPath: "capacitor-offline.html",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      launchAutoHide: true,
      backgroundColor: PWA_BACKGROUND_COLOR,
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: PWA_THEME_COLOR,
    },
  },
};

export default config;
