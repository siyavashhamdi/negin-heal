import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 300;

/**
 * Returns `value` after it has stayed unchanged for `delay` milliseconds.
 */
export const useDebounce = <T>(value: T, delay: number = DEFAULT_DELAY_MS): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
};
