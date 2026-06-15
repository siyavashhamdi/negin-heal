/**
 * LocalStorage key constants
 * Keys are uppercase in code but stored as kebab-case in localStorage
 */
export const LOCAL_STORAGE_KEYS = {
  THEME_MODE: "theme-mode",
  NOTIFICATIONS_ENABLED: "notifications-enabled",
  ACCESS_TOKEN: "access-token",
} as const;

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];
