const presentedNotificationIds = new Set<string>();

export function markNotificationPresented(notificationId: string): void {
  const normalizedId = notificationId.trim();
  if (!normalizedId) {
    return;
  }

  presentedNotificationIds.add(normalizedId);
}

export function wasNotificationPresented(notificationId: string): boolean {
  const normalizedId = notificationId.trim();
  if (!normalizedId) {
    return false;
  }

  return presentedNotificationIds.has(normalizedId);
}
