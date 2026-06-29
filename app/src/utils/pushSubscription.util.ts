import { apolloClient } from "../lib/apollo-client";
import { API_CONFIG } from "../config";
import { LOCAL_STORAGE_KEYS } from "../constants";
import {
  REGISTER_PUSH_SUBSCRIPTION_MUTATION,
  UNREGISTER_PUSH_SUBSCRIPTION_MUTATION,
} from "../graphql/mutations/pushSubscription.mutation";
import { PUSH_NOTIFICATION_CONFIG_QUERY } from "../graphql/queries/pushNotificationConfig.query";
import {
  getBrowserNotificationPermission,
  isBrowserNotificationDeliverySupported,
} from "./browserNotification.util";
import { readStoredNotificationsEnabled } from "./userPreferences.util";
import { getPwaServiceWorkerRegistration } from "./pwaRegistration.util";
import { isNativeCapacitorShell } from "./apiBaseUrl.util";

type PushNotificationConfigQueryResult = {
  readonly pushNotificationConfig: {
    readonly enabled: boolean;
    readonly publicKey?: string | null;
  };
};

type RegisterPushSubscriptionVariables = {
  readonly input: {
    readonly endpoint: string;
    readonly keys: {
      readonly p256dh: string;
      readonly auth: string;
    };
    readonly replacesEndpoint?: string | null;
  };
};

type UnregisterPushSubscriptionVariables = {
  readonly input: {
    readonly endpoint: string;
  };
};

const SW_READY_MAX_WAIT_MS = 20_000;
const SW_READY_POLL_MS = 400;

let cachedPublicKey: string | null | undefined;
let syncInFlight: Promise<boolean> | null = null;
let unregisterInFlight: Promise<void> | null = null;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function readConfiguredPublicKey(): string | null {
  const envKey = API_CONFIG.VAPID_PUBLIC_KEY?.trim();
  return envKey || null;
}

function readStoredVapidPublicKey(): string | null {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.VAPID_PUBLIC_KEY);
  return stored?.trim() || null;
}

function storeVapidPublicKey(publicKey: string): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.VAPID_PUBLIC_KEY, publicKey);
}

function clearStoredPushSubscriptionMetadata(options?: { readonly clearEndpoint?: boolean }): void {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.VAPID_PUBLIC_KEY);

  if (options?.clearEndpoint) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PUSH_SUBSCRIPTION_ENDPOINT);
  }
}

function readStoredPushSubscriptionEndpoint(): string | null {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.PUSH_SUBSCRIPTION_ENDPOINT);
  return stored?.trim() || null;
}

function storePushSubscriptionEndpoint(endpoint: string): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.PUSH_SUBSCRIPTION_ENDPOINT, endpoint);
}

function logPushDebug(message: string, detail?: unknown): void {
  if (import.meta.env.DEV) {
    if (detail !== undefined) {
      console.info(`[Push] ${message}`, detail);
      return;
    }
    console.info(`[Push] ${message}`);
  }
}

function logPushWarning(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.warn(`[Push] ${message}`, detail);
    return;
  }
  console.warn(`[Push] ${message}`);
}

async function resolveVapidPublicKey(): Promise<string | null> {
  const configuredKey = readConfiguredPublicKey();
  if (configuredKey) {
    return configuredKey;
  }

  if (cachedPublicKey !== undefined) {
    return cachedPublicKey;
  }

  try {
    const result = await apolloClient.query<PushNotificationConfigQueryResult>({
      query: PUSH_NOTIFICATION_CONFIG_QUERY,
      fetchPolicy: "network-only",
    });

    const publicKey = result.data?.pushNotificationConfig?.publicKey?.trim() || null;
    cachedPublicKey = publicKey;
    return publicKey;
  } catch (error) {
    logPushWarning("Failed to load pushNotificationConfig from API.", error);
    cachedPublicKey = null;
    return null;
  }
}

async function waitForPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  const deadline = Date.now() + SW_READY_MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const registration = await getPwaServiceWorkerRegistration();
    if (registration?.pushManager) {
      return registration;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, SW_READY_POLL_MS);
    });
  }

  logPushWarning("Timed out waiting for service worker registration with PushManager.");
  return null;
}

export function canSyncWebPushSubscription(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    isBrowserNotificationDeliverySupported() &&
    getBrowserNotificationPermission() === "granted" &&
    readStoredNotificationsEnabled()
  );
}

export async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (isNativeCapacitorShell()) {
    return null;
  }

  const registration = await waitForPushServiceWorkerRegistration();
  if (!registration?.pushManager) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

async function createBrowserPushSubscription(
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription | null> {
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (error) {
    logPushWarning("Initial PushManager.subscribe() failed; retrying after unsubscribe.", error);

    const existingSubscription = await registration.pushManager.getSubscription();
    if (!existingSubscription) {
      return null;
    }

    await existingSubscription.unsubscribe().catch(() => undefined);

    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (retryError) {
      logPushWarning("PushManager.subscribe() retry failed.", retryError);
      return null;
    }
  }
}

export async function subscribeToWebPush(): Promise<PushSubscription | null> {
  const registration = await waitForPushServiceWorkerRegistration();
  if (!registration?.pushManager) {
    logPushWarning("PushManager is unavailable — service worker may not be ready yet.");
    return null;
  }

  const publicKey = await resolveVapidPublicKey();
  if (!publicKey) {
    logPushWarning("VAPID public key is missing — cannot subscribe to Web Push.");
    return null;
  }

  const storedVapidKey = readStoredVapidPublicKey();
  let existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && storedVapidKey && storedVapidKey !== publicKey) {
    logPushDebug("VAPID key changed — removing stale browser push subscription.");
    await existingSubscription.unsubscribe().catch(() => undefined);
    clearStoredPushSubscriptionMetadata({ clearEndpoint: true });
    existingSubscription = null;
  }

  if (existingSubscription && (!storedVapidKey || storedVapidKey === publicKey)) {
    return existingSubscription;
  }

  const subscription = await createBrowserPushSubscription(registration, publicKey);
  if (subscription) {
    storeVapidPublicKey(publicKey);
  }

  return subscription;
}

async function registerPushSubscriptionWithServer(
  subscription: PushSubscription
): Promise<boolean> {
  const json = subscription.toJSON();
  const endpoint = json.endpoint?.trim();
  const p256dh = json.keys?.p256dh?.trim();
  const auth = json.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    logPushWarning("Browser push subscription is missing endpoint or encryption keys.");
    return false;
  }

  const storedEndpoint = readStoredPushSubscriptionEndpoint();
  const replacesEndpoint =
    storedEndpoint && storedEndpoint !== endpoint ? storedEndpoint : undefined;

  try {
    const result = await apolloClient.mutate<
      { readonly registerPushSubscription: { readonly success: boolean } },
      RegisterPushSubscriptionVariables
    >({
      mutation: REGISTER_PUSH_SUBSCRIPTION_MUTATION,
      variables: {
        input: {
          endpoint,
          keys: { p256dh, auth },
          replacesEndpoint,
        },
      },
    });

    const success = Boolean(result.data?.registerPushSubscription?.success);
    if (success) {
      storePushSubscriptionEndpoint(endpoint);
      logPushDebug("Registered push subscription with server.", endpoint);
    } else {
      logPushWarning("registerPushSubscription mutation returned no success flag.", result);
    }

    return success;
  } catch (error) {
    logPushWarning("registerPushSubscription mutation failed.", error);
    return false;
  }
}

async function syncWebPushSubscriptionWithServerInternal(): Promise<boolean> {
  if (!canSyncWebPushSubscription()) {
    logPushDebug("Skipping push sync — permission, preference, or browser support missing.");
    return false;
  }

  const subscription = await subscribeToWebPush();
  if (!subscription) {
    return false;
  }

  const registered = await registerPushSubscriptionWithServer(subscription);
  return registered;
}

export async function syncWebPushSubscriptionWithServer(): Promise<boolean> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = syncWebPushSubscriptionWithServerInternal().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function unregisterWebPushSubscriptionFromServer(options?: {
  readonly clearStoredEndpoint?: boolean;
  readonly authToken?: string | null;
}): Promise<void> {
  if (isNativeCapacitorShell()) {
    clearStoredPushSubscriptionMetadata({
      clearEndpoint: options?.clearStoredEndpoint ?? false,
    });
    return;
  }

  if (unregisterInFlight) {
    return unregisterInFlight;
  }

  unregisterInFlight = unregisterWebPushSubscriptionFromServerInternal(options).finally(() => {
    unregisterInFlight = null;
  });

  return unregisterInFlight;
}

async function unregisterWebPushSubscriptionFromServerInternal(options?: {
  readonly clearStoredEndpoint?: boolean;
  readonly authToken?: string | null;
}): Promise<void> {
  const subscription = await getBrowserPushSubscription();
  const endpoint = subscription?.endpoint?.trim() ?? readStoredPushSubscriptionEndpoint();

  if (endpoint) {
    const authToken = options?.authToken?.trim();
    await apolloClient
      .mutate<
        { readonly unregisterPushSubscription: { readonly success: boolean } },
        UnregisterPushSubscriptionVariables
      >({
        mutation: UNREGISTER_PUSH_SUBSCRIPTION_MUTATION,
        variables: {
          input: { endpoint },
        },
        context: authToken
          ? {
              headers: {
                authorization: `Bearer ${authToken}`,
              },
            }
          : {},
      })
      .catch((error: unknown) => {
        logPushWarning("unregisterPushSubscription mutation failed.", error);
      });
  }

  if (subscription) {
    await subscription.unsubscribe().catch(() => undefined);
  }

  clearStoredPushSubscriptionMetadata({
    clearEndpoint: options?.clearStoredEndpoint ?? false,
  });
}

export function resetCachedPushNotificationConfig(): void {
  cachedPublicKey = undefined;
}
