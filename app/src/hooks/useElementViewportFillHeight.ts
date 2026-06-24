import { useLayoutEffect, useRef, useState, type RefObject } from "react";

const DEFAULT_BOTTOM_RESERVE_PX = 88;
const MIN_FILL_HEIGHT_PX = 200;

function readMobileBottomReservePx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--app-mobile-bottom-reserve")
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BOTTOM_RESERVE_PX;
}

export function useElementViewportFillHeight(enabled: boolean): {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly heightPx: number | null;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [heightPx, setHeightPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setHeightPx(null);
      return;
    }

    const measure = (): void => {
      const node = ref.current;
      if (!node) {
        return;
      }

      const top = node.getBoundingClientRect().top;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const nextHeight = Math.max(
        MIN_FILL_HEIGHT_PX,
        Math.floor(viewportHeight - top - readMobileBottomReservePx())
      );

      setHeightPx((previous) => (previous === nextHeight ? previous : nextHeight));
    };

    measure();

    const observer = new ResizeObserver(measure);
    const node = ref.current;
    if (node) {
      observer.observe(node);
    }
    observer.observe(document.documentElement);

    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [enabled]);

  return { ref, heightPx };
}
