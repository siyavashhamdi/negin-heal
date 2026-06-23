import { type ReactElement } from "react";

import { scrollToTopOnMobile } from "../../utils/scrollToTopOnMobile.util";
import styles from "./SegmentFilterTabs.module.scss";

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
  const pinnedClassName =
    pinnedSurface === "dialog" ? styles.filterTabsPinnedDialog : styles.filterTabsPinned;
  const tabListClassName = pinned
    ? `${styles.filterTabs} ${pinnedClassName}`
    : styles.filterTabs;

  return (
    <div
      className={tabListClassName}
      role="tablist"
      aria-label={ariaLabel}
      {...(pinned ? { "data-opaque-shell": true } : {})}
      {...(pinned && pinnedAnchorId ? { [`data-${pinnedAnchorId}`]: "" } : {})}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
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
