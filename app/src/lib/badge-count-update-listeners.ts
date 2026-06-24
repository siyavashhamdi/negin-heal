type BadgeCountUpdateListener = () => void;

const listeners = new Set<BadgeCountUpdateListener>();

export const subscribeBadgeCountUpdates = (listener: BadgeCountUpdateListener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const notifyBadgeCountUpdateListeners = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};
