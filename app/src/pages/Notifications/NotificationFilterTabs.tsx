import { type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import type { NotificationFilterTab } from "./notifications-list.api";
import styles from "./styles/notifications.module.scss";

type NotificationFilterTabsProps = {
  readonly activeTab: NotificationFilterTab;
  readonly onChange: (tab: NotificationFilterTab) => void;
};

const TAB_ORDER: NotificationFilterTab[] = ["unread", "read", "archived", "all"];

const NotificationFilterTabs = ({
  activeTab,
  onChange,
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
          </button>
        );
      })}
    </div>
  );
};

export default NotificationFilterTabs;
