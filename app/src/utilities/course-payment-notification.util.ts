const COURSE_PAYMENT_PAID_NOTIFICATION_TITLE = "دسترسی به دوره فعال شد";

const PAYMENT_STATUS_NOTIFICATION_TITLES = new Set([
  COURSE_PAYMENT_PAID_NOTIFICATION_TITLE,
  "پرداخت دوره تأیید نشد",
  "بازپرداخت دوره ثبت شد",
  "پرداخت دوره لغو شد",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCoursePaymentStatusNotificationCourseId(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const courseId = typeof payload.courseId === "string" ? payload.courseId.trim() : "";
  if (!courseId) {
    return null;
  }

  if (typeof payload.chapterKey === "string") {
    return null;
  }

  const purchaseStatus =
    typeof payload.purchaseStatus === "string" ? payload.purchaseStatus.trim() : "";
  if (purchaseStatus === "PENDING") {
    return null;
  }

  if (payload.changedByInvestigationTeam === true) {
    return courseId;
  }

  if (typeof payload.approvedByInvestigationTeam === "boolean") {
    return courseId;
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (PAYMENT_STATUS_NOTIFICATION_TITLES.has(title)) {
    return courseId;
  }

  return null;
}

/** @deprecated Use `parseCoursePaymentStatusNotificationCourseId` instead. */
export const parseCoursePaymentPaidNotificationCourseId =
  parseCoursePaymentStatusNotificationCourseId;
