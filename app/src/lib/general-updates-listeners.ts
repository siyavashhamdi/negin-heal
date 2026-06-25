import type { GeneralUpdateEvent } from "../hooks/useGeneralUpdatesSubscription";

type GeneralUpdateListener = (event: GeneralUpdateEvent) => void;
type GeneralUpdatesOnlineListener = (isOnline: boolean | null) => void;

const updateListeners = new Set<GeneralUpdateListener>();
const onlineListeners = new Set<GeneralUpdatesOnlineListener>();
let subscriptionOnline: boolean | null = null;

export const subscribeGeneralUpdates = (listener: GeneralUpdateListener): (() => void) => {
  updateListeners.add(listener);

  return () => {
    updateListeners.delete(listener);
  };
};

export const notifyGeneralUpdateListeners = (event: GeneralUpdateEvent): void => {
  for (const listener of updateListeners) {
    listener(event);
  }
};

export const subscribeGeneralUpdatesOnline = (
  listener: GeneralUpdatesOnlineListener
): (() => void) => {
  onlineListeners.add(listener);
  listener(subscriptionOnline);

  return () => {
    onlineListeners.delete(listener);
  };
};

export const setGeneralUpdatesOnline = (isOnline: boolean | null): void => {
  if (subscriptionOnline === isOnline) {
    return;
  }

  subscriptionOnline = isOnline;

  for (const listener of onlineListeners) {
    listener(isOnline);
  }
};

export const getGeneralUpdatesOnline = (): boolean | null => subscriptionOnline;

export const isGeneralUpdatesSubscriptionOffline = (): boolean => subscriptionOnline === false;
