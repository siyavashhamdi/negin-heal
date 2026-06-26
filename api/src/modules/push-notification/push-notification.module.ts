import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import {
  RegisterPushSubscriptionMutation,
  RegisterNativePushTokenMutation,
  UnregisterPushSubscriptionMutation,
  UnregisterNativePushTokenMutation,
} from "./graphql/mutations";
import { PushNotificationConfigQuery } from "./graphql/queries";
import { PushNotificationService } from "./push-notification.service";

@Module({
  imports: [DatabaseModule],
  providers: [
    PushNotificationService,
    RegisterPushSubscriptionMutation,
    UnregisterPushSubscriptionMutation,
    RegisterNativePushTokenMutation,
    UnregisterNativePushTokenMutation,
    PushNotificationConfigQuery,
  ],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
