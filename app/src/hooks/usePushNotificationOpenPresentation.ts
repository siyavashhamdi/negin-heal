import { useEffect } from "react";

import { subscribePushNotificationOpen } from "../lib/push-open-listeners";
import {
  presentInAppNotificationMessage,
  type InAppNotificationPopup,
} from "../utils/inAppNotificationPresentation.util";
import {
  markNotificationPresented,
  wasNotificationPresented,
} from "../utils/presented-notification-ids.util";
import type { PushNotificationOpenPayload } from "../types/push-notification-open.types";
import { useSnackbar } from "./useSnackbar";

type UsePushNotificationOpenPresentationOptions = {
  readonly enabled?: boolean;
  readonly onShowPopup: (popup: InAppNotificationPopup) => void;
};

function resolvePresentationId(payload: PushNotificationOpenPayload): string {
  return payload.notificationId?.trim() || `push-open-${payload.description}`;
}

export function usePushNotificationOpenPresentation({
  enabled = true,
  onShowPopup,
}: UsePushNotificationOpenPresentationOptions): void {
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const presentPushOpenNotification = (payload: PushNotificationOpenPayload): void => {
      const presentationId = resolvePresentationId(payload);
      if (wasNotificationPresented(presentationId)) {
        return;
      }

      const didPresent = presentInAppNotificationMessage(
        {
          id: presentationId,
          title: payload.title,
          description: payload.description,
          messageType: payload.messageType,
          mode: payload.mode,
          productId: payload.productId,
          chapterKey: payload.chapterKey,
          action: payload.action,
          actionLabel: payload.actionLabel,
          actionUrl: payload.actionUrl,
        },
        {
          showSnackbar,
          showPopup: onShowPopup,
        },
        { fallbackToSnackbar: true, includeSnackbarTitle: false }
      );

      if (didPresent) {
        markNotificationPresented(presentationId);
      }
    };

    return subscribePushNotificationOpen(presentPushOpenNotification);
  }, [enabled, onShowPopup, showSnackbar]);
}
