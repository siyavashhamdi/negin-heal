declare global {
  interface Window {
    /** Debug: set to `1` to cancel any in-flight retry wait and restart from attempt 0. */
    _x?: number;
  }
}

/** Exponential phase: 1s, 2s, 4s, 8s, 16s (5 attempts). Then 15s polling forever. */
export const WS_SUBSCRIPTION_RETRY_ATTEMPTS = 5;

export const WS_SUBSCRIPTION_BASE_RETRY_DELAY_MS = 1_000;

export const WS_SUBSCRIPTION_POLL_INTERVAL_MS = 15_000;

const SUBSCRIPTION_RETRY_DEBUG_WAIT_CHUNK_MS = 50;

type SubscriptionRetryWaitResult = "completed" | "debug-reset" | "aborted";

const subscriptionRetryResetListeners = new Set<() => void>();

let activeRetryWaitAbortController = new AbortController();
let debugResetHookInstalled = false;
let debugResetValue = 0;

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

/** @deprecated Use {@link subscribeSubscriptionRetryReset}. */
export const subscribeSubscriptionRetryDebugReset = subscribeSubscriptionRetryReset;

export function isSubscriptionRetryDebugResetRequested(): boolean {
  return debugResetValue === 1;
}

export function abortAllSubscriptionRetryWaits(): void {
  activeRetryWaitAbortController.abort();
  activeRetryWaitAbortController = new AbortController();
}

export function getActiveSubscriptionRetryWaitSignal(): AbortSignal {
  return activeRetryWaitAbortController.signal;
}

/** Cancel every in-flight retry wait and restart the subscription from attempt 0. */
export function resetSubscriptionRetryFromStart(): void {
  abortAllSubscriptionRetryWaits();
  notifySubscriptionRetryReset();
}

/** Cancel every in-flight retry timer and notify listeners to restart from attempt 0. */
export function triggerSubscriptionRetryDebugReset(): void {
  if (!isSubscriptionRetryDebugResetRequested()) {
    return;
  }

  debugResetValue = 0;
  resetSubscriptionRetryFromStart();
}

export function installSubscriptionRetryDebugResetHook(): void {
  if (debugResetHookInstalled || typeof window === "undefined") {
    return;
  }

  debugResetHookInstalled = true;

  Object.defineProperty(window, "_x", {
    configurable: true,
    enumerable: true,
    get(): number {
      return debugResetValue;
    },
    set(value: number): void {
      debugResetValue = value;
      if (value === 1) {
        triggerSubscriptionRetryDebugReset();
      }
    },
  });
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

function sleepInterruptibly(ms: number, signals: readonly AbortSignal[]): Promise<"slept" | "aborted"> {
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
  const signals = signal
    ? [getActiveSubscriptionRetryWaitSignal(), signal]
    : [getActiveSubscriptionRetryWaitSignal()];

  if (signals.some(isAbortSignalActive)) {
    return "aborted";
  }

  const deadline = Date.now() + delayMs;

  while (Date.now() < deadline) {
    if (signals.some(isAbortSignalActive)) {
      return "aborted";
    }

    if (isSubscriptionRetryDebugResetRequested()) {
      triggerSubscriptionRetryDebugReset();
      return "debug-reset";
    }

    const remaining = deadline - Date.now();
    const chunkMs = Math.min(SUBSCRIPTION_RETRY_DEBUG_WAIT_CHUNK_MS, remaining);
    if (chunkMs <= 0) {
      break;
    }

    const sleepResult = await sleepInterruptibly(chunkMs, signals);
    if (sleepResult === "aborted") {
      return "aborted";
    }
  }

  if (signals.some(isAbortSignalActive)) {
    return "aborted";
  }

  if (isSubscriptionRetryDebugResetRequested()) {
    triggerSubscriptionRetryDebugReset();
    return "debug-reset";
  }

  return "completed";
}
