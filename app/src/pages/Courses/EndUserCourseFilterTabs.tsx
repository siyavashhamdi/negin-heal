import { type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";

export type EndUserCourseTab = "ALL" | "PURCHASED" | "PURCHASABLE" | "FREE";

const END_USER_COURSE_TABS: ReadonlyArray<{ value: EndUserCourseTab; label: string }> = [
  { value: "ALL", label: "هـمـــــــــه" },
  { value: "PURCHASED", label: "خریداری‌شده" },
  { value: "PURCHASABLE", label: "قابـل خرید" },
  { value: "FREE", label: "رایـگــــان" },
];

type EndUserCourseFilterTabsProps = {
  readonly activeTab: EndUserCourseTab;
  readonly onChange: (tab: EndUserCourseTab) => void;
};

const EndUserCourseFilterTabs = ({
  activeTab,
  onChange,
}: EndUserCourseFilterTabsProps): ReactElement => {
  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={END_USER_COURSE_TABS}
      onChange={onChange}
      ariaLabel="دسته‌بندی دوره‌ها"
      pinned
    />
  );
};

export default EndUserCourseFilterTabs;
