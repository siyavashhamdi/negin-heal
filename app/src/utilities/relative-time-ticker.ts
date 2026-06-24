import { getRelativeTimeNextTickMs } from "./relative-time.util";

type RelativeTimeSubscriber = {
  readonly dateMs: number;
  readonly onTick: () => void;
};

const subscribers = new Set<RelativeTimeSubscriber>();
let timeoutId: number | undefined;

function getSoonestTickMs(now: number): number {
  let soonestTickMs = Infinity;

  for (const subscriber of subscribers) {
    const nextTickMs = getRelativeTimeNextTickMs(new Date(subscriber.dateMs), now);
    if (nextTickMs < soonestTickMs) {
      soonestTickMs = nextTickMs;
    }
  }

  return soonestTickMs;
}

function clearScheduledTick(): void {
  if (timeoutId === undefined) {
    return;
  }

  window.clearTimeout(timeoutId);
  timeoutId = undefined;
}

function scheduleNextTick(): void {
  clearScheduledTick();

  if (subscribers.size === 0) {
    return;
  }

  const delayMs = getSoonestTickMs(Date.now());
  if (!Number.isFinite(delayMs)) {
    return;
  }

  timeoutId = window.setTimeout(() => {
    timeoutId = undefined;

    for (const subscriber of subscribers) {
      subscriber.onTick();
    }

    scheduleNextTick();
  }, delayMs);
}

/**
 * Subscribe to relative-time label updates for a single timestamp.
 * All subscribers share one adaptive setTimeout (not setInterval) scheduled to
 * the soonest label change across every mounted relative date on the page.
 */
export function subscribeRelativeTimeTick(date: Date, onTick: () => void): () => void {
  const subscriber: RelativeTimeSubscriber = {
    dateMs: date.getTime(),
    onTick,
  };

  subscribers.add(subscriber);
  scheduleNextTick();

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      clearScheduledTick();
      return;
    }

    scheduleNextTick();
  };
}
