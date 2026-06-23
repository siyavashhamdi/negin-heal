const COURSE_PAYMENT_PAID_NOTIFICATION_TITLE = "دسترسی به دوره فعال شد";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCoursePaymentPaidNotificationCourseId(
  payload: unknown,
): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const courseId =
    typeof payload.courseId === "string" ? payload.courseId.trim() : "";
  if (!courseId) {
    return null;
  }

  if (typeof payload.chapterKey === "string") {
    return null;
  }

  if (typeof payload.approvedByInvestigationTeam === "boolean") {
    return courseId;
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (title === COURSE_PAYMENT_PAID_NOTIFICATION_TITLE) {
    return courseId;
  }

  return null;
}
