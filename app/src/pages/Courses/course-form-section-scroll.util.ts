import type { CourseSectionTab } from "./course-section-tabs.shared";
import { COURSE_FORM_SECTION_TARGETS } from "./course-section-tabs.shared";

export function scrollToCourseFormSection(section: CourseSectionTab): void {
  const targetId = COURSE_FORM_SECTION_TARGETS[section];
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
