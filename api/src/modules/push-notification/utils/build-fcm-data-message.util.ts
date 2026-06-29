import { buildPushNotificationUrl } from "./build-push-notification-url.util";
import { DEFAULT_PUSH_TITLE } from "./resolve-web-push-content.util";

export const FCM_MESSAGE_TYPE_BADGE_SYNC = "badge_sync";
export const FCM_MESSAGE_TYPE_NOTIFICATION = "notification";

export function buildFcmBadgeSyncData(
  badgeCount: number,
): Record<string, string> {
  return {
    type: FCM_MESSAGE_TYPE_BADGE_SYNC,
    badgeCount: String(Math.max(0, badgeCount)),
  };
}

export function buildFcmNotificationData(input: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  notificationId?: string;
  badgeCount: number;
  payload?: Record<string, unknown> | null;
}): Record<string, string> {
  const data: Record<string, string> = {
    type: FCM_MESSAGE_TYPE_NOTIFICATION,
    title: DEFAULT_PUSH_TITLE,
    body: input.body,
    url: input.url ?? buildPushNotificationUrl(input.payload),
    tag: input.tag ?? input.notificationId ?? "negin-heal-push",
    badgeCount: String(Math.max(0, input.badgeCount)),
  };

  if (input.notificationId) {
    data.notificationId = input.notificationId;
  }

  return data;
}
