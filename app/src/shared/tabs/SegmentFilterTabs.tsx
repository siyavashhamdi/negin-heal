import { useCallback, useLayoutEffect, useRef, useState, type ReactElement } from "react";

import { scrollToTopOnMobile } from "../../utils/scrollToTopOnMobile.util";
import styles from "./SegmentFilterTabs.module.scss";

type IndicatorMetrics = {
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
};

export type SegmentFilterTabOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

type SegmentFilterTabsProps<T extends string> = {
  readonly activeTab: T;
  readonly tabs: ReadonlyArray<SegmentFilterTabOption<T>>;
  readonly onChange: (tab: T) => void;
  readonly ariaLabel: string;
  readonly pinned?: boolean;
  /** Where pinned tabs stick: page scroll (mobile) or dialog/modal scroll container. */
  readonly pinnedSurface?: "page" | "dialog";
  readonly disableScrollToTopOnChange?: boolean;
  /** Sets `data-{pinnedAnchorId}` on the tablist when pinned (for scroll offset hooks). */
  readonly pinnedAnchorId?: string;
};

function SegmentFilterTabs<T extends string>({
  activeTab,
  tabs,
  onChange,
  ariaLabel,
  pinned = false,
  pinnedSurface = "page",
  disableScrollToTopOnChange = false,
  pinnedAnchorId,
}: SegmentFilterTabsProps<T>): ReactElement {
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());
  const [indicatorMetrics, setIndicatorMetrics] = useState<IndicatorMetrics | null>(null);
  const [indicatorAnimated, setIndicatorAnimated] = useState(false);

  const updateIndicator = useCallback((): void => {
    const container = tabListRef.current;
    const activeButton = tabRefs.current.get(activeTab);

    if (!container || !activeButton) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeButton.getBoundingClientRect();

    setIndicatorMetrics({
      width: tabRect.width,
      height: tabRect.height,
      x: tabRect.left - containerRect.left,
      y: tabRect.top - containerRect.top,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();
    setIndicatorAnimated(true);
  }, [updateIndicator, tabs]);

  useLayoutEffect(() => {
    const container = tabListRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateIndicator();
    });

    observer.observe(container);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  const pinnedClassName =
    pinnedSurface === "dialog" ? styles.filterTabsPinnedDialog : styles.filterTabsPinned;
  const tabListClassName = pinned ? `${styles.filterTabs} ${pinnedClassName}` : styles.filterTabs;

  return (
    <div
      ref={tabListRef}
      className={tabListClassName}
      role="tablist"
      aria-label={ariaLabel}
      {...(pinned ? { "data-opaque-shell": true } : {})}
      {...(pinned && pinnedAnchorId ? { [`data-${pinnedAnchorId}`]: "" } : {})}
    >
      {indicatorMetrics ? (
        <span
          aria-hidden="true"
          className={`${styles.filterTabIndicator}${
            indicatorAnimated ? ` ${styles.filterTabIndicatorAnimated}` : ""
          }`}
          style={{
            width: indicatorMetrics.width,
            height: indicatorMetrics.height,
            transform: `translate3d(${indicatorMetrics.x}px, ${indicatorMetrics.y}px, 0)`,
          }}
        />
      ) : null}
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            ref={(element) => {
              if (element) {
                tabRefs.current.set(tab.value, element);
              } else {
                tabRefs.current.delete(tab.value);
              }
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.filterTab}${isActive ? ` ${styles.filterTabActive}` : ""}`}
            onClick={() => {
              onChange(tab.value);
              if (!disableScrollToTopOnChange) {
                scrollToTopOnMobile();
              }
            }}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentFilterTabs;
