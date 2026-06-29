export function buildPushNotificationUrl(
  payload: Record<string, unknown> | null | undefined,
): string {
  if (!payload) {
    return "/notifications";
  }

  const productId =
    typeof payload.productId === "string" ? payload.productId.trim() : "";
  const chapterKey =
    typeof payload.chapterKey === "string" ? payload.chapterKey.trim() : "";

  if (productId && chapterKey) {
    const params = new URLSearchParams({ chapter: chapterKey });
    return `/courses/${productId}?${params.toString()}`;
  }

  if (productId) {
    return `/courses/${productId}`;
  }

  return "/notifications";
}
