import { type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { formatTableCellNumber } from "../../utilities/persian-digits.util";
import type { NotificationFilterTab } from "./notifications-list.api";
import styles from "./styles/notifications.module.scss";

type NotificationFilterTabsProps = {
  readonly activeTab: NotificationFilterTab;
  readonly onChange: (tab: NotificationFilterTab) => void;
  readonly totalCount?: number;
};

const TAB_ORDER: NotificationFilterTab[] = ["all", "unread", "read", "archived"];

const NotificationFilterTabs = ({
  activeTab,
  onChange,
  totalCount,
}: NotificationFilterTabsProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <div
      className={styles.filterTabs}
      role="tablist"
      aria-label={t("pages.notifications.filters.ariaLabel")}
    >
      {TAB_ORDER.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.filterTab}${isActive ? ` ${styles.filterTabActive}` : ""}`}
            onClick={() => onChange(tab)}
          >
            <span>{t(`pages.notifications.filters.${tab}`)}</span>
            {isActive && typeof totalCount === "number" ? (
              <span className={styles.filterTabCount}>
                {formatTableCellNumber(totalCount)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default NotificationFilterTabs;
