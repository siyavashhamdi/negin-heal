import { useEffect, useState } from "react";

import { subscribeRelativeTimeTick } from "../utilities/relative-time-ticker";
import { shouldUseRelativeTimeLabel } from "../utilities/relative-time.util";

/**
 * Returns a moving "now" timestamp for relative date labels.
 * Pass `null` for absolute (old) dates — no timer is started.
 * Uses one shared adaptive timer across all mounted consumers.
 */
export function useRelativeTimeNow(dateMs: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (dateMs !== null) {
      const date = new Date(dateMs);
      if (shouldUseRelativeTimeLabel(date)) {
        unsubscribe = subscribeRelativeTimeTick(date, () => {
          const nextNow = Date.now();
          setNow(nextNow);

          if (!shouldUseRelativeTimeLabel(date, nextNow)) {
            unsubscribe?.();
            unsubscribe = undefined;
          }
        });
      }
    }

    return (): void => {
      unsubscribe?.();
    };
  }, [dateMs]);

  return now;
}
