export function buildPushNotificationUrl(
  payload: Record<string, unknown> | null | undefined,
): string {
  if (!payload) {
    return "/notifications";
  }

  const courseId =
    typeof payload.courseId === "string" ? payload.courseId.trim() : "";
  const chapterKey =
    typeof payload.chapterKey === "string" ? payload.chapterKey.trim() : "";

  if (courseId && chapterKey) {
    const params = new URLSearchParams({ chapter: chapterKey });
    return `/courses/${courseId}?${params.toString()}`;
  }

  if (courseId) {
    return `/courses/${courseId}`;
  }

  return "/notifications";
}
