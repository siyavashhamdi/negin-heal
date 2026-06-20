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
};

function SegmentFilterTabs<T extends string>({
  activeTab,
  tabs,
  onChange,
  ariaLabel,
  pinned = false,
}: SegmentFilterTabsProps<T>): ReactElement {
  const tabsElement = (
    <div className={styles.filterTabs} role="tablist" aria-label={ariaLabel}>
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
              scrollToTopOnMobile();
            }}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (!pinned) {
    return tabsElement;
  }

  return <div className={styles.pinnedShell}>{tabsElement}</div>;
}

export default SegmentFilterTabs;
