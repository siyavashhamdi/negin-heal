import type { GeneralNotificationMessageType } from "../constants";
import type { PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE } from "../constants/push-notification-open.constants";

export type PushNotificationOpenPayload = {
  readonly type: typeof PUSH_NOTIFICATION_OPEN_MESSAGE_TYPE;
  readonly notificationId?: string;
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
