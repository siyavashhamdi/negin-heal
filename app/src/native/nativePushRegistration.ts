import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";

import { apolloClient } from "../lib/apollo-client";
import {
  REGISTER_NATIVE_PUSH_TOKEN_MUTATION,
  UNREGISTER_NATIVE_PUSH_TOKEN_MUTATION,
} from "../graphql/mutations/nativePushToken.mutation";
import { LOCAL_STORAGE_KEYS } from "../constants";
import { isAndroidApp } from "../utils/androidAppDownload.util";
import { readStoredNotificationsEnabled } from "../utils/userPreferences.util";
import { clearLauncherBadgeCount, syncLauncherBadgeCount } from "./launcherBadge";

type RegisterNativePushTokenVariables = {
  readonly input: {
    readonly token: string;
    readonly platform: "ANDROID";
  };
};

type UnregisterNativePushTokenVariables = {
  readonly input: {
    readonly token: string;
  };
};

let listenersRegistered = false;
let syncInFlight: Promise<boolean> | null = null;
let unregisterInFlight: Promise<void> | null = null;

function isNativeAndroidShell(): boolean {
  return isAndroidApp() && Capacitor.getPlatform() === "android";
}

function readStoredNativePushToken(): string | null {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.NATIVE_PUSH_TOKEN);
  return stored?.trim() || null;
}

function storeNativePushToken(token: string): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.NATIVE_PUSH_TOKEN, token);
}

function clearStoredNativePushToken(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.NATIVE_PUSH_TOKEN);
}

function parseBadgeCountFromPushData(data: Record<string, unknown> | undefined): number | null {
  const rawValue = data?.badgeCount;
  const parsed =
    typeof rawValue === "string"
      ? Number.parseInt(rawValue, 10)
      : typeof rawValue === "number"
        ? rawValue
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.floor(parsed));
}

async function registerNativePushTokenWithServer(token: string): Promise<boolean> {
  try {
    const result = await apolloClient.mutate<
      { readonly registerNativePushToken: { readonly success: boolean } },
      RegisterNativePushTokenVariables
    >({
      mutation: REGISTER_NATIVE_PUSH_TOKEN_MUTATION,
      variables: {
        input: {
          token,
          platform: "ANDROID",
        },
      },
    });

    const success = Boolean(result.data?.registerNativePushToken?.success);
    if (success) {
      storeNativePushToken(token);
    }

    return success;
  } catch (error) {
    console.warn("[NativePush] registerNativePushToken mutation failed.", error);
    return false;
  }
}

async function unregisterNativePushTokenFromServer(token: string): Promise<void> {
  try {
    await apolloClient.mutate<
      { readonly unregisterNativePushToken: { readonly success: boolean } },
      UnregisterNativePushTokenVariables
    >({
      mutation: UNREGISTER_NATIVE_PUSH_TOKEN_MUTATION,
      variables: {
        input: { token },
      },
    });
  } catch (error) {
    console.warn("[NativePush] unregisterNativePushToken mutation failed.", error);
  }
}

function handlePushNotification(notification: PushNotificationSchema): void {
  const badgeCount = parseBadgeCountFromPushData(notification.data);
  if (badgeCount !== null) {
    void syncLauncherBadgeCount(badgeCount);
  }
}

function registerNativePushListeners(): void {
  if (listenersRegistered || !isNativeAndroidShell()) {
    return;
  }

  listenersRegistered = true;

  void PushNotifications.addListener("registration", (event: Token) => {
    const token = event.value?.trim();
    if (!token) {
      return;
    }

    void registerNativePushTokenWithServer(token);
  });

  void PushNotifications.addListener("registrationError", (error) => {
    console.warn("[NativePush] Registration failed.", error);
  });

  void PushNotifications.addListener("pushNotificationReceived", (notification) => {
    handlePushNotification(notification);
  });

  void PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    handlePushNotification(action.notification);
  });
}

export async function syncNativePushRegistrationWithServer(): Promise<boolean> {
  if (!isNativeAndroidShell() || !readStoredNotificationsEnabled()) {
    return false;
  }

  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = syncNativePushRegistrationWithServerInternal().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

async function syncNativePushRegistrationWithServerInternal(): Promise<boolean> {
  registerNativePushListeners();

  const permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    const requested = await PushNotifications.requestPermissions();
    if (requested.receive !== "granted") {
      return false;
    }
  }

  await PushNotifications.register();
  return true;
}

export async function unregisterNativePushFromServer(options?: {
  readonly clearStoredToken?: boolean;
}): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  if (unregisterInFlight) {
    return unregisterInFlight;
  }

  unregisterInFlight = unregisterNativePushFromServerInternal(options).finally(() => {
    unregisterInFlight = null;
  });

  return unregisterInFlight;
}

async function unregisterNativePushFromServerInternal(options?: {
  readonly clearStoredToken?: boolean;
}): Promise<void> {
  const token = readStoredNativePushToken();

  if (token) {
    await unregisterNativePushTokenFromServer(token);
  }

  if (options?.clearStoredToken ?? false) {
    clearStoredNativePushToken();
  }

  await PushNotifications.unregister().catch(() => undefined);
  await clearLauncherBadgeCount();
}

export async function bootstrapNativePushAndBadge(): Promise<void> {
  if (!isNativeAndroidShell()) {
    return;
  }

  registerNativePushListeners();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { type?: string; badgeCount?: unknown } | null;
      if (data?.type !== "launcher-badge-sync") {
        return;
      }

      const badgeCount =
        typeof data.badgeCount === "number"
          ? data.badgeCount
          : typeof data.badgeCount === "string"
            ? Number.parseInt(data.badgeCount, 10)
            : Number.NaN;

      if (!Number.isFinite(badgeCount)) {
        return;
      }

      void syncLauncherBadgeCount(badgeCount);
    });
  }

  void App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      void syncNativePushRegistrationWithServer();
    }
  });
}
