import { useCallback, type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";
import {
  COURSE_FORM_SECTION_TABS,
  type CourseSectionTab,
} from "./course-section-tabs.shared";

type CourseFormSectionTabsProps = {
  readonly activeTab: CourseSectionTab;
  readonly onChange: (tab: CourseSectionTab) => void;
};

const CourseFormSectionTabs = ({
  activeTab,
  onChange,
}: CourseFormSectionTabsProps): ReactElement => {
  const handleTabChange = useCallback(
    (tab: CourseSectionTab): void => {
      onChange(tab);
    },
    [onChange],
  );

  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={COURSE_FORM_SECTION_TABS}
      onChange={handleTabChange}
      ariaLabel="بخش‌های ویرایش دوره"
      pinned
      pinnedSurface="dialog"
      pinnedAnchorId="course-form-tabs"
      disableScrollToTopOnChange
    />
  );
};

export default CourseFormSectionTabs;
