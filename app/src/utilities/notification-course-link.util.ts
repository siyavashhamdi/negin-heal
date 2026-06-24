import { APP_SHELL_ROUTES } from "../routing/app-shell-routes";

export type NotificationCourseLink = {
  readonly courseId: string;
  readonly href: string;
  readonly actionLabel: "viewCourse" | "viewChapter";
  readonly chapterKey?: string;
};

const buildCourseDetailHref = (courseId: string, chapterKey?: string): string => {
  const baseHref = APP_SHELL_ROUTES.courseDetail.replace(":courseId", courseId);

  if (!chapterKey) {
    return baseHref;
  }

  const params = new URLSearchParams({ chapter: chapterKey });
  return `${baseHref}?${params.toString()}`;
};

export const resolveNotificationCourseLink = (
  source: string,
  payload: Record<string, unknown> | null
): NotificationCourseLink | null => {
  if (!payload) {
    return null;
  }

  const courseId = typeof payload.courseId === "string" ? payload.courseId.trim() : "";

  if (!courseId) {
    return null;
  }

  if (source === "COURSE_CHAPTER") {
    const chapterKey = typeof payload.chapterKey === "string" ? payload.chapterKey.trim() : "";

    if (!chapterKey) {
      return null;
    }

    return {
      courseId,
      chapterKey,
      href: buildCourseDetailHref(courseId, chapterKey),
      actionLabel: "viewChapter",
    };
  }

  if (source === "PAYMENT") {
    return {
      courseId,
      href: buildCourseDetailHref(courseId),
      actionLabel: "viewCourse",
    };
  }

  return null;
};
