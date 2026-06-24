type AuthSessionExpiredListener = () => void;

const listeners = new Set<AuthSessionExpiredListener>();

export const subscribeAuthSessionExpired = (listener: AuthSessionExpiredListener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const notifyAuthSessionExpired = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};
