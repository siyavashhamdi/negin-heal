const DEFAULT_PUSH_TITLE = "نگین هیل";

export function resolveWebPushTitle(
  subscriptionPayload: Record<string, unknown> | null | undefined,
  fallbackTitle?: string | null,
): string {
  const payloadTitle =
    typeof subscriptionPayload?.title === "string"
      ? subscriptionPayload.title.trim()
      : "";

  if (payloadTitle) {
    return payloadTitle;
  }

  const fallback =
    typeof fallbackTitle === "string" ? fallbackTitle.trim() : "";

  return fallback || DEFAULT_PUSH_TITLE;
}

export function resolveWebPushBody(
  subscriptionPayload: Record<string, unknown> | null | undefined,
  fallbackBody?: string | null,
): string {
  const payloadDescription =
    typeof subscriptionPayload?.description === "string"
      ? subscriptionPayload.description.trim()
      : "";

  if (payloadDescription) {
    return payloadDescription;
  }

  const fallback =
    typeof fallbackBody === "string" ? fallbackBody.trim() : "";

  return fallback || "اعلان جدیدی برای شما ثبت شد.";
}
