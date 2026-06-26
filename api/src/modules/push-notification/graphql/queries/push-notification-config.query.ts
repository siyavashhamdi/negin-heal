import { Query, Resolver } from "@nestjs/graphql";

import { PushNotificationService } from "../../push-notification.service";
import { PushNotificationConfigGqlResponse } from "../responses";

@Resolver(() => PushNotificationConfigGqlResponse)
export class PushNotificationConfigQuery {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Query(() => PushNotificationConfigGqlResponse, {
    name: "pushNotificationConfig",
    description: "Public Web Push configuration for browser subscription setup",
  })
  pushNotificationConfig(): PushNotificationConfigGqlResponse {
    const publicKey = this.pushNotificationService.getPublicKey();

    return {
      enabled: this.pushNotificationService.isEnabled(),
      publicKey,
      nativePushEnabled: this.pushNotificationService.isNativePushEnabled(),
    };
  }
}
