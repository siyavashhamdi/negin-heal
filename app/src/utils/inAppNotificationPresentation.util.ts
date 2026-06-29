import {
  GENERAL_NOTIFICATION_MESSAGE_TYPES,
  type GeneralNotificationMessageType,
} from "../constants";
import { resolveNotificationActionPayload } from "../utilities/notification-action.util";

export type InAppNotificationPopupMode = "info" | "success" | "warning" | "error";

export type InAppNotificationPopup = {
  readonly id: string;
  readonly title?: string;
  readonly description: string;
  readonly mode: InAppNotificationPopupMode;
  readonly action?: {
    readonly label: string;
    readonly href: string;
  };
};

export type InAppNotificationPresentationInput = {
  readonly id?: string;
  readonly title?: string;
  readonly description: string;
  readonly messageType?: GeneralNotificationMessageType | string;
  readonly mode?: string;
  readonly productId?: string;
  readonly chapterKey?: string;
  readonly action?: {
    readonly label?: string;
    readonly href?: string;
    readonly url?: string;
    readonly to?: string;
  };
  readonly actionLabel?: string;
  readonly actionUrl?: string;
};

export type InAppNotificationPresentationHandlers = {
  readonly showSnackbar: (
    message: string,
    severity: "info" | "success" | "warning" | "error"
  ) => void;
  readonly showPopup: (popup: InAppNotificationPopup) => void;
};

export function resolveInAppNotificationPopupMode(value: unknown): InAppNotificationPopupMode {
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

export function resolveInAppNotificationSnackbarSeverity(
  value: unknown
): "info" | "success" | "warning" | "error" {
  return resolveInAppNotificationPopupMode(value);
}

function buildSnackbarMessage(title: string | undefined, description: string): string {
  const normalizedTitle = title?.trim();
  if (normalizedTitle) {
    return `${normalizedTitle}: ${description}`;
  }

  return description;
}

export function presentInAppNotificationMessage(
  input: InAppNotificationPresentationInput,
  handlers: InAppNotificationPresentationHandlers,
  options?: {
    readonly fallbackToSnackbar?: boolean;
    readonly includeSnackbarTitle?: boolean;
  }
): boolean {
  const title =
    typeof input.title === "string" && input.title.trim().length > 0
      ? input.title.trim()
      : undefined;
  const description =
    typeof input.description === "string" && input.description.trim().length > 0
      ? input.description.trim()
      : "رویداد جدیدی برای حساب شما ثبت شد.";
  const messageType =
    typeof input.messageType === "string" ? input.messageType.toUpperCase() : undefined;
  const popupId = input.id?.trim() || `notification-${Date.now()}`;
  const includeSnackbarTitle = options?.includeSnackbarTitle !== false;
  const snackbarMessage = includeSnackbarTitle
    ? buildSnackbarMessage(title, description)
    : description;

  if (!messageType) {
    if (options?.fallbackToSnackbar === false) {
      return false;
    }

    handlers.showSnackbar(snackbarMessage, resolveInAppNotificationSnackbarSeverity(input.mode));
    return true;
  }

  if (messageType === GENERAL_NOTIFICATION_MESSAGE_TYPES.SNACKBAR) {
    handlers.showSnackbar(snackbarMessage, resolveInAppNotificationSnackbarSeverity(input.mode));
    return true;
  }

  if (messageType === GENERAL_NOTIFICATION_MESSAGE_TYPES.POPUP) {
    handlers.showPopup({
      id: popupId,
      title,
      description,
      mode: resolveInAppNotificationPopupMode(input.mode),
      action:
        resolveNotificationActionPayload({
          action: input.action,
          actionLabel: input.actionLabel,
          actionUrl: input.actionUrl,
          productId: input.productId,
          chapterKey: input.chapterKey,
        }) ?? undefined,
    });
    return true;
  }

  if (options?.fallbackToSnackbar !== false) {
    handlers.showSnackbar(snackbarMessage, resolveInAppNotificationSnackbarSeverity(input.mode));
    return true;
  }

  return false;
}
