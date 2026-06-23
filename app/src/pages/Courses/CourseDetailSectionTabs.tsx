import { type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";
import {
  COURSE_SECTION_TABS,
  type CourseSectionTab,
} from "./course-section-tabs.shared";

export type CourseDetailSectionTab = CourseSectionTab;

type CourseDetailSectionTabsProps = {
  readonly activeTab: CourseDetailSectionTab;
  readonly onChange: (tab: CourseDetailSectionTab) => void;
};

const CourseDetailSectionTabs = ({
  activeTab,
  onChange,
}: CourseDetailSectionTabsProps): ReactElement => {
  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={COURSE_SECTION_TABS}
      onChange={onChange}
      ariaLabel="بخش‌های صفحه دوره"
      pinned
      pinnedAnchorId="course-detail-tabs"
      disableScrollToTopOnChange
    />
  );
};

export default CourseDetailSectionTabs;
