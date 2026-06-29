/** Exponential phase: 1s, 2s, 4s, 8s (4 attempts). Then 8s polling forever. */
export const WS_SUBSCRIPTION_RETRY_ATTEMPTS = 4;

export const WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS = 1_000;

export const WS_SUBSCRIPTION_POLL_INTERVAL_MS = 8_000;

type SubscriptionRetryWaitResult = "completed" | "aborted";

const subscriptionRetryResetListeners = new Set<() => void>();

let activeRetryWaitAbortController = new AbortController();

function getActiveRetryWaitSignal(): AbortSignal {
  return activeRetryWaitAbortController.signal;
}

function notifySubscriptionRetryReset(): void {
  for (const listener of subscriptionRetryResetListeners) {
    listener();
  }
}

export function subscribeSubscriptionRetryReset(listener: () => void): () => void {
  subscriptionRetryResetListeners.add(listener);

  return () => {
    subscriptionRetryResetListeners.delete(listener);
  };
}

function abortActiveRetryWaits(): void {
  activeRetryWaitAbortController.abort();
  activeRetryWaitAbortController = new AbortController();
}

/** Cancel in-flight retry waits and restart the subscription from attempt 0. */
export function resetSubscriptionRetryFromStart(): void {
  abortActiveRetryWaits();
  notifySubscriptionRetryReset();
}

export function resolveSubscriptionRetryDelayMs(attempt: number): number {
  if (attempt < WS_SUBSCRIPTION_RETRY_ATTEMPTS) {
    return WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS * 2 ** attempt;
  }

  return WS_SUBSCRIPTION_POLL_INTERVAL_MS;
}

function isAbortSignalActive(signal: AbortSignal): boolean {
  return signal.aborted;
}

function sleepUntilAbort(
  ms: number,
  signals: readonly AbortSignal[]
): Promise<"slept" | "aborted"> {
  if (signals.some(isAbortSignalActive)) {
    return Promise.resolve("aborted");
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      for (const signal of signals) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve("slept");
    }, ms);

    const onAbort = (): void => {
      clearTimeout(timer);
      for (const signal of signals) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve("aborted");
    };

    for (const signal of signals) {
      signal.addEventListener("abort", onAbort);
    }
  });
}

export async function waitForSubscriptionRetryDelayMs(
  delayMs: number,
  signal?: AbortSignal
): Promise<SubscriptionRetryWaitResult> {
  const signals = signal ? [getActiveRetryWaitSignal(), signal] : [getActiveRetryWaitSignal()];

  if (signals.some(isAbortSignalActive)) {
    return "aborted";
  }

  const sleepResult = await sleepUntilAbort(delayMs, signals);
  return sleepResult === "aborted" ? "aborted" : "completed";
}
