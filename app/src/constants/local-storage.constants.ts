/**
 * LocalStorage key constants
 * Keys are uppercase in code but stored as kebab-case in localStorage
 */
export const LOCAL_STORAGE_KEYS = {
  THEME_MODE: "theme-mode",
  NOTIFICATIONS_ENABLED: "notifications-enabled",
  ACCESS_TOKEN: "access-token",
  VAPID_PUBLIC_KEY: "vapid-public-key",
  PUSH_SUBSCRIPTION_ENDPOINT: "push-subscription-endpoint",
  NATIVE_PUSH_TOKEN: "native-push-token",
} as const;

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS];
