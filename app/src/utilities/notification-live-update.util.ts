import type { AlertColor } from "@mui/material";

import {
  GENERAL_NOTIFICATION_MESSAGE_TYPES,
  type GeneralNotificationMessageType,
} from "../constants";
import type { GeneralUpdateEvent } from "../hooks/useGeneralUpdatesSubscription";
import type { NotificationSource } from "../pages/Notifications/notifications-list.api";
import { inferNotificationSourceFromPayload } from "./infer-notification-source.util";

export type NotificationLiveBannerState = {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly severity: AlertColor;
  readonly payload: Record<string, unknown> | null;
  readonly source: NotificationSource | null;
  readonly messageType?: GeneralNotificationMessageType;
};

type NotificationPayloadShape = {
  readonly title?: string | null;
  readonly description?: string | null;
  readonly message?: string | null;
  readonly mode?: string;
  readonly messageType?: string;
  readonly source?: string;
  readonly productId?: string;
  readonly chapterKey?: string;
  readonly purchaseStatus?: string;
  readonly action?: {
    readonly label?: string;
    readonly href?: string;
    readonly url?: string;
    readonly to?: string;
  };
  readonly actionLabel?: string;
  readonly actionUrl?: string;
};

function asNotificationPayload(value: unknown): NotificationPayloadShape | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as NotificationPayloadShape;
}

function resolveNotificationDescription(payload: NotificationPayloadShape | null): string {
  if (typeof payload?.description === "string" && payload.description.trim().length > 0) {
    return payload.description.trim();
  }

  if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
    return payload.message.trim();
  }

  return "رویداد جدیدی برای حساب شما ثبت شد.";
}

function resolveNotificationTitle(
  payload: NotificationPayloadShape | null,
  description: string
): string {
  if (typeof payload?.title === "string" && payload.title.trim().length > 0) {
    return payload.title.trim();
  }

  return description;
}

export function resolveNotificationBannerSeverity(value: unknown): AlertColor {
  if (typeof value !== "string") {
    return "info";
  }

  switch (value.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "WARN":
    case "WARNING":
      return "warning";
    case "ERROR":
      return "error";
    case "INFO":
    default:
      return "info";
  }
}

export function parseNotificationLiveUpdate(
  event: GeneralUpdateEvent
): NotificationLiveBannerState | null {
  const payload = asNotificationPayload(event.payload);
  const message = resolveNotificationDescription(payload);
  const title = resolveNotificationTitle(payload, message);
  const messageType =
    typeof payload?.messageType === "string"
      ? (payload.messageType.toUpperCase() as GeneralNotificationMessageType)
      : undefined;
  const notificationPayloadRecord = payload ? (payload as Record<string, unknown>) : null;

  return {
    id: event.targetId || `${event.updateType}-${event.createdAt}`,
    title,
    message,
    severity: resolveNotificationBannerSeverity(payload?.mode),
    payload: notificationPayloadRecord,
    source: inferNotificationSourceFromPayload(notificationPayloadRecord),
    messageType,
  };
}

export function shouldShowNotificationLiveBanner(
  banner: NotificationLiveBannerState,
  isNotificationsPage: boolean
): boolean {
  if (isNotificationsPage) {
    return false;
  }

  if (banner.messageType === GENERAL_NOTIFICATION_MESSAGE_TYPES.POPUP) {
    return false;
  }

  return true;
}
