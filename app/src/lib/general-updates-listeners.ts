import type { GeneralUpdateEvent } from "../hooks/useGeneralUpdatesSubscription";

type GeneralUpdateListener = (event: GeneralUpdateEvent) => void;

const listeners = new Set<GeneralUpdateListener>();

export const subscribeGeneralUpdates = (listener: GeneralUpdateListener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const notifyGeneralUpdateListeners = (event: GeneralUpdateEvent): void => {
  listeners.forEach((listener) => {
    listener(event);
  });
};
