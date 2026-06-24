import { type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";
import { COURSE_SECTION_TABS, type CourseSectionTab } from "./course-section-tabs.shared";

export type CourseDetailSectionTab = CourseSectionTab;

type CourseDetailSectionTabsProps = {
  readonly activeTab: CourseDetailSectionTab;
  readonly onChange: (tab: CourseDetailSectionTab) => void;
  readonly tabs?: ReadonlyArray<{
    readonly value: CourseDetailSectionTab;
    readonly label: string;
  }>;
};

const CourseDetailSectionTabs = ({
  activeTab,
  onChange,
  tabs = COURSE_SECTION_TABS,
}: CourseDetailSectionTabsProps): ReactElement => {
  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={tabs}
      onChange={onChange}
      ariaLabel="بخش‌های صفحه دوره"
      pinned
      pinnedAnchorId="course-detail-tabs"
      disableScrollToTopOnChange
    />
  );
};

export default CourseDetailSectionTabs;
