type GeneralUpdatesOnlineListener = (isOnline: boolean) => void;

const listeners = new Set<GeneralUpdatesOnlineListener>();
let currentOnline = false;

export const subscribeGeneralUpdatesOnline = (
  listener: GeneralUpdatesOnlineListener,
): (() => void) => {
  listeners.add(listener);
  listener(currentOnline);

  return () => {
    listeners.delete(listener);
  };
};

export const setGeneralUpdatesOnline = (isOnline: boolean): void => {
  if (currentOnline === isOnline) {
    return;
  }

  currentOnline = isOnline;
  for (const listener of listeners) {
    listener(isOnline);
  }
};
