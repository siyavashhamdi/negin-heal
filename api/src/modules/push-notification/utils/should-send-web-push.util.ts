export function isGlobalAnnouncementPushPayload(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  if (!payload) {
    return false;
  }

  const messageType =
    typeof payload.messageType === "string"
      ? payload.messageType.toUpperCase()
      : "";
  const isAnnouncementMessageType =
    messageType === "POPUP" || messageType === "SNACKBAR";

  if (!isAnnouncementMessageType) {
    return false;
  }

  return (
    !payload.productId &&
    !payload.chapterKey &&
    payload.purchaseStatus === undefined
  );
}

export function shouldSendWebPush(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  if (!payload) {
    return true;
  }

  if (isGlobalAnnouncementPushPayload(payload)) {
    return Boolean(payload.isPushNotification);
  }

  return true;
}
