import { Capacitor } from "@capacitor/core";
import { API_CONFIG } from "../config";
import { resolveAppBaseUrl } from "../seo/build-page-seo";

/** True when running inside a Capacitor native shell (Android APK). */
export function isNativeCapacitorShell(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

/**
 * Resolves the backend origin for HTTP/WebSocket API calls.
 * Native bundled shells use the configured production API host because the
 * WebView origin only serves local assets.
 */
export function resolveApiBaseUrl(): string {
  const configured = API_CONFIG.API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
  if (isNativeCapacitorShell() && appUrl) {
    return appUrl;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

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
