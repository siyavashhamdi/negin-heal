import type { CourseDetailChapter, CourseDetailItem } from "./course-detail.api";

export function buildCourseItemPreviewId(chapterKey: string, itemIndex: number): string {
  return `${chapterKey}:${itemIndex}`;
}

export function findCourseDetailItemByPreviewId(
  chapters: readonly CourseDetailChapter[],
  previewId: string
): { chapterKey: string; itemIndex: number; item: CourseDetailItem } | null {
  const match = /^([^:]+):(\d+)$/.exec(previewId.trim());
  if (!match) {
    return null;
  }

  const chapterKey = match[1];
  const itemIndex = Number(match[2]);
  if (!Number.isInteger(itemIndex) || itemIndex < 0) {
    return null;
  }

  const chapter = chapters.find((entry) => entry.key === chapterKey);
  const item = chapter?.items?.[itemIndex];
  if (!item) {
    return null;
  }

  return { chapterKey, itemIndex, item };
}
