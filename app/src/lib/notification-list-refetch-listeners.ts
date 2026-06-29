type NotificationListRefetchListener = () => void;

const listeners = new Set<NotificationListRefetchListener>();
let pendingRefetch = false;

export const subscribeNotificationListRefetch = (
  listener: NotificationListRefetchListener
): (() => void) => {
  listeners.add(listener);

  if (pendingRefetch) {
    listener();
  }

  return () => {
    listeners.delete(listener);
  };
};

export const notifyNotificationListRefetchListeners = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};

export const markNotificationListRefetchPending = (): void => {
  pendingRefetch = true;
  notifyNotificationListRefetchListeners();
};

export const consumePendingNotificationListRefetch = (): boolean => {
  if (!pendingRefetch) {
    return false;
  }

  pendingRefetch = false;
  return true;
};
