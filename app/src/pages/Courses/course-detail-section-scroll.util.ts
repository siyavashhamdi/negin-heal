import type { CourseSectionTab } from "./course-section-tabs.shared";
import { COURSE_DETAIL_SECTION_TARGETS } from "./course-section-tabs.shared";

export type CourseDetailSectionTab = CourseSectionTab;

export { COURSE_DETAIL_SECTION_TARGETS };

const MOBILE_PINNED_TABS_OFFSET_QUERY = "(max-width: 37.4375rem)";

function getPinnedTabsScrollOffset(): number {
  if (!window.matchMedia(MOBILE_PINNED_TABS_OFFSET_QUERY).matches) {
    return 12;
  }

  const tabsShell = document.querySelector<HTMLElement>("[data-course-detail-tabs]");
  if (!tabsShell) {
    return 72;
  }

  const styles = window.getComputedStyle(tabsShell);
  const stickyTop = Number.parseFloat(styles.top) || 0;
  return stickyTop + tabsShell.offsetHeight + 8;
}

export function scrollToCourseDetailSection(section: CourseDetailSectionTab): void {
  const targetId = COURSE_DETAIL_SECTION_TARGETS[section];
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  const offset = getPinnedTabsScrollOffset();
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);

  window.scrollTo({
    top,
    behavior: "smooth",
  });
}
