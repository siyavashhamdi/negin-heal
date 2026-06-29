import { Capacitor } from "@capacitor/core";
import { API_CONFIG } from "../config";
import { resolveAppBaseUrl } from "../seo/build-page-seo";

/** True when running inside a Capacitor native shell (Android APK). */
export function isNativeCapacitorShell(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Resolves the backend origin for HTTP/WebSocket API calls.
 *
 * In the browser, requests go to the current page origin so Vite (dev) or Nginx
 * (prod) can proxy `/graphql` and `/api`. `VITE_API_BASE_URL` is still used as
 * the Vite dev proxy target and as the API host in Capacitor native builds.
 */
export function resolveApiBaseUrl(): string {
  if (isNativeCapacitorShell()) {
    const configured = API_CONFIG.API_BASE_URL?.trim();
    if (configured) {
      return configured.replace(/\/$/, "");
    }

    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    if (appUrl) {
      return appUrl;
    }
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  const configured = API_CONFIG.API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
  return appUrl;
}

export function resolveApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBaseUrl()}${normalizedPath}`;
}

export function resolveGraphqlHttpUrl(): string {
  return resolveApiUrl("/graphql");
}

export function resolveGraphqlWsUrl(): string {
  const apiBase = resolveApiBaseUrl();
  const wsBase = apiBase.replace(/^http/i, "ws");
  return `${wsBase}/graphql`;
}
