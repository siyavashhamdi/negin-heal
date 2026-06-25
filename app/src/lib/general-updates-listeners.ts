import type { GeneralUpdateEvent } from "../hooks/useGeneralUpdatesSubscription";

type GeneralUpdateListener = (event: GeneralUpdateEvent) => void;
type GeneralUpdatesOnlineListener = (isOnline: boolean) => void;

const updateListeners = new Set<GeneralUpdateListener>();
const onlineListeners = new Set<GeneralUpdatesOnlineListener>();
let subscriptionOnline = false;

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

export const setGeneralUpdatesOnline = (isOnline: boolean): void => {
  if (subscriptionOnline === isOnline) {
    return;
  }

  subscriptionOnline = isOnline;

  for (const listener of onlineListeners) {
    listener(isOnline);
  }
};

export const getGeneralUpdatesOnline = (): boolean => subscriptionOnline;
