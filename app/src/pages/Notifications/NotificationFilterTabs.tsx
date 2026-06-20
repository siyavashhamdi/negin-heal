import { type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";
import { useTranslation } from "../../hooks/useTranslation";
import type { NotificationFilterTab } from "./notifications-list.api";

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
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={TAB_ORDER.map((tab) => ({
        value: tab,
        label: t(`pages.notifications.filters.${tab}`),
      }))}
      onChange={onChange}
      ariaLabel={t("pages.notifications.filters.ariaLabel")}
      pinned
    />
  );
};

export default NotificationFilterTabs;
