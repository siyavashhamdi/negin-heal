const PRODUCT_PAYMENT_PAID_NOTIFICATION_TITLE = "دسترسی به دوره فعال شد";

const PAYMENT_STATUS_NOTIFICATION_TITLES = new Set([
  PRODUCT_PAYMENT_PAID_NOTIFICATION_TITLE,
  "پرداخت دوره تأیید نشد",
  "بازپرداخت دوره ثبت شد",
  "پرداخت دوره لغو شد",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseProductPaymentStatusNotificationProductId(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const productId = typeof payload.productId === "string" ? payload.productId.trim() : "";
  if (!productId) {
    return null;
  }

  if (typeof payload.chapterKey === "string") {
    return null;
  }

  const purchaseStatus =
    typeof payload.purchaseStatus === "string" ? payload.purchaseStatus.trim() : "";
  if (purchaseStatus === "PENDING" || purchaseStatus === "PENDING_GATEWAY") {
    return null;
  }

  if (payload.changedByInvestigationTeam === true) {
    return productId;
  }

  if (typeof payload.approvedByInvestigationTeam === "boolean") {
    return productId;
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (PAYMENT_STATUS_NOTIFICATION_TITLES.has(title)) {
    return productId;
  }

  return null;
}

/** @deprecated Use `parseProductPaymentStatusNotificationProductId` instead. */
export const parseProductPaymentPaidNotificationProductId =
  parseProductPaymentStatusNotificationProductId;
