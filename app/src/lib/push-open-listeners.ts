import type { PushNotificationOpenPayload } from "../types/push-notification-open.types";

type PushNotificationOpenListener = (payload: PushNotificationOpenPayload) => void;

const listeners = new Set<PushNotificationOpenListener>();

export const subscribePushNotificationOpen = (
  listener: PushNotificationOpenListener
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const notifyPushNotificationOpenListeners = (payload: PushNotificationOpenPayload): void => {
  for (const listener of listeners) {
    listener(payload);
  }
};
