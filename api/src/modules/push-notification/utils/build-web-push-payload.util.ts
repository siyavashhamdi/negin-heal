import { buildPushNotificationUrl } from "./build-push-notification-url.util";

export function buildWebPushPayloadJson(input: {
  title: string;
  body: string;
  tag?: string;
  notificationId?: string;
  badgeCount: number;
  payload?: Record<string, unknown> | null;
}): string {
  const subscriptionPayload = input.payload ?? {};
  const inAppTitle =
    typeof subscriptionPayload.title === "string" && subscriptionPayload.title.trim().length > 0
      ? subscriptionPayload.title.trim()
      : input.title;
  const description =
    typeof subscriptionPayload.description === "string" &&
    subscriptionPayload.description.trim().length > 0
      ? subscriptionPayload.description.trim()
      : input.body;

  const record: Record<string, unknown> = {
    title: input.title,
    body: input.body,
    inAppTitle,
    description,
    url: buildPushNotificationUrl(subscriptionPayload),
    tag: input.tag ?? input.notificationId ?? "negin-heal-push",
    notificationId: input.notificationId,
    badgeCount: input.badgeCount,
  };

  for (const key of [
    "messageType",
    "mode",
    "courseId",
    "chapterKey",
    "action",
    "actionLabel",
    "actionUrl",
    "purchaseStatus",
  ] as const) {
    if (subscriptionPayload[key] != null) {
      record[key] = subscriptionPayload[key];
    }
  }

  return JSON.stringify(record);
}
