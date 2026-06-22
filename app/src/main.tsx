import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import "./i18n/config";
import { bootstrapCapacitorNativeShell } from "./native/capacitorBootstrap";
import { registerPwaServiceWorker } from "./utils/pwaRegistration.util";

void bootstrapCapacitorNativeShell();
registerPwaServiceWorker();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains <div id="root"></div>.');
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
