import type { PaletteMode } from "@mui/material";
import { LOCAL_STORAGE_KEYS } from "../constants";
import {
  getBrowserNotificationPermission,
  registerNotificationServiceWorker,
} from "./browserNotification.util";
import {
  syncWebPushSubscriptionWithServer,
  unregisterWebPushSubscriptionFromServer,
} from "./pushSubscription.util";
import {
  syncNativePushRegistrationWithServer,
  unregisterNativePushFromServer,
} from "../native/nativePushRegistration";

export type ThemePreference = "dark" | "light";

export type UserPreferencesLike = {
  readonly theme?: string | null;
  readonly notificationsEnabled?: boolean | null;
};

export const USER_PREFERENCES_CHANGED_EVENT = "negin-heal:user-preferences-changed";

export function resolveThemePreference(value: string | null | undefined): ThemePreference | null {
  return value === "dark" || value === "light" ? value : null;
}

export function readStoredNotificationsEnabled(fallback = true): boolean {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  if (stored === "true") {
    return true;
  }
  if (stored === "false") {
    return false;
  }
  return fallback;
}

export function applyThemeToDocument(mode: PaletteMode): void {
  document.documentElement.setAttribute("data-theme", mode);
  document.body.setAttribute("data-theme", mode);
}

export function applyUserPreferences(preferences: UserPreferencesLike | null | undefined): void {
  if (!preferences) {
    return;
  }

  let changed = false;
  const theme = resolveThemePreference(preferences.theme);
  if (theme) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME_MODE, theme);
    applyThemeToDocument(theme);
    changed = true;
  }

  if (typeof preferences.notificationsEnabled === "boolean") {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS_ENABLED,
      String(preferences.notificationsEnabled)
    );
    changed = true;

    if (preferences.notificationsEnabled && getBrowserNotificationPermission() === "granted") {
      void registerNotificationServiceWorker();
      void syncWebPushSubscriptionWithServer();
      void syncNativePushRegistrationWithServer();
    } else if (!preferences.notificationsEnabled) {
      void unregisterWebPushSubscriptionFromServer();
      void unregisterNativePushFromServer();
    }
  }

  if (changed) {
    window.dispatchEvent(new Event(USER_PREFERENCES_CHANGED_EVENT));
  }
}
