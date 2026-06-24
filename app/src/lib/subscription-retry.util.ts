/** Exponential phase: 1s, 2s, 4s, 8s, 16s (5 attempts). Then 15s polling forever. */
export const WS_SUBSCRIPTION_RETRY_ATTEMPTS = 5;

export const WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS = 1_000;

export const WS_SUBSCRIPTION_POLL_INTERVAL_MS = 15_000;

export function resolveSubscriptionRetryDelayMs(attempt: number): number {
  if (attempt < WS_SUBSCRIPTION_RETRY_ATTEMPTS) {
    return WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS * 2 ** attempt;
  }

  return WS_SUBSCRIPTION_POLL_INTERVAL_MS;
}
