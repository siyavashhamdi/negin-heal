export const DEFAULT_PUSH_TITLE = "نگین هیل";

export function resolveWebPushTitle(
  _subscriptionPayload?: Record<string, unknown> | null,
  _fallbackTitle?: string | null,
): string {
  return DEFAULT_PUSH_TITLE;
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

  const fallback = typeof fallbackBody === "string" ? fallbackBody.trim() : "";

  return fallback || "اعلان جدیدی برای شما ثبت شد.";
}
