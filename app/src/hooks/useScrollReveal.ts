import { useEffect, useRef, useState, type RefObject } from "react";

type UseScrollRevealOptions = IntersectionObserverInit & {
  readonly once?: boolean;
};

type UseScrollRevealResult<T extends HTMLElement> = {
  readonly ref: RefObject<T>;
  readonly isVisible: boolean;
};

/**
 * Reveals an element when it enters the viewport — used for landing-page scroll animations.
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): UseScrollRevealResult<T> {
  const {
    once = true,
    threshold = 0.12,
    rootMargin = "0px 0px -4% 0px",
    ...observerOptions
  } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setIsVisible(true);

        if (once) {
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin, ...observerOptions }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [once, rootMargin, threshold]);

  return { ref, isVisible };
}
