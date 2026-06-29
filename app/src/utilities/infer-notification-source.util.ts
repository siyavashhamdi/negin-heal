import type { NotificationSource } from "../pages/Notifications/notifications-list.api";

const NOTIFICATION_SOURCES = new Set<NotificationSource>([
  "PRODUCT",
  "PRODUCT_CHAPTER",
  "PAYMENT",
  "USER",
  "TICKET",
  "OTHER",
]);

export function inferNotificationSourceFromPayload(
  payload: Record<string, unknown> | null
): NotificationSource | null {
  if (!payload) {
    return null;
  }

  if (typeof payload.source === "string") {
    const normalizedSource = payload.source.trim().toUpperCase() as NotificationSource;
    if (NOTIFICATION_SOURCES.has(normalizedSource)) {
      return normalizedSource;
    }
  }

  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";
  const chapterKey = typeof payload.chapterKey === "string" ? payload.chapterKey.trim() : "";

  if (productId && chapterKey) {
    return "PRODUCT_CHAPTER";
  }

  if (productId && payload.purchaseStatus != null) {
    return "PAYMENT";
  }

  return null;
}
