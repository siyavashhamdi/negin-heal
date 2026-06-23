export type CourseSectionTab = "intro" | "content" | "reviews";

export const COURSE_SECTION_TABS: ReadonlyArray<{
  readonly value: CourseSectionTab;
  readonly label: string;
}> = [
  { value: "intro", label: "معرفی دوره" },
  { value: "content", label: "محتوای دوره" },
  { value: "reviews", label: "امتیاز و نظرات" },
];

export const COURSE_FORM_SECTION_TABS: ReadonlyArray<{
  readonly value: CourseSectionTab;
  readonly label: string;
}> = [
  { value: "intro", label: "اطلاعات اصلی" },
  { value: "content", label: "فصل‌ها" },
  { value: "reviews", label: "امتیاز و نظرات" },
];

export const COURSE_DETAIL_SECTION_TARGETS: Record<CourseSectionTab, string> = {
  intro: "course-intro",
  content: "course-content",
  reviews: "course-reviews",
};

export const COURSE_FORM_SECTION_TARGETS: Record<CourseSectionTab, string> = {
  intro: "course-form-intro",
  content: "course-form-content",
  reviews: "course-form-reviews",
};
