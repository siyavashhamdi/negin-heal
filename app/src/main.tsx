import "./utils/devConsole.util";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import "./i18n/config";
import { bootstrapCapacitorNativeShell } from "./native/capacitorBootstrap";
import { registerPwaServiceWorker } from "./utils/pwaRegistration.util";
import { isNativeAndroidShell } from "./utils/nativePlatform.util";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains <div id="root"></div>.');
}

async function bootstrap(): Promise<void> {
  void bootstrapCapacitorNativeShell();

  if (!isNativeAndroidShell()) {
    registerPwaServiceWorker();
  }

  if (!navigator.onLine && "serviceWorker" in navigator && !isNativeAndroidShell()) {
    try {
      await navigator.serviceWorker.ready;
    } catch {
      // Best effort before rendering the offline shell.
    }
  }

  ReactDOM.createRoot(rootElement as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
