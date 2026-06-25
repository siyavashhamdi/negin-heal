import { isGeneralUpdatesSubscriptionOffline } from "./general-updates-listeners";

export const CURSOR_FETCH_RETRY_DELAY_MS = 1_000;

export const CURSOR_FETCH_MAX_ATTEMPTS = 3;

export const CURSOR_FETCH_OFFLINE_FIRST_ATTEMPTS = 1;

export function resolveCursorFetchMaxAttempts(useFullRetryAfterScrollAway: boolean): number {
  if (isGeneralUpdatesSubscriptionOffline() && !useFullRetryAfterScrollAway) {
    return CURSOR_FETCH_OFFLINE_FIRST_ATTEMPTS;
  }

  return CURSOR_FETCH_MAX_ATTEMPTS;
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
