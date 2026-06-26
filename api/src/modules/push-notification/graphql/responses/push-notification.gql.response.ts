import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PushSubscriptionMutationGqlResponse {
  @Field(() => Boolean, {
    description: "Whether the push subscription operation succeeded",
  })
  success: boolean;
}

@ObjectType()
export class PushNotificationConfigGqlResponse {
  @Field(() => Boolean, {
    description: "Whether server-side Web Push delivery is configured",
  })
  enabled: boolean;

  @Field(() => String, {
    nullable: true,
    description: "VAPID public key used by clients for PushManager.subscribe()",
  })
  publicKey?: string | null;

  @Field(() => Boolean, {
    description:
      "Whether server-side native mobile push (FCM) delivery is configured",
  })
  nativePushEnabled: boolean;
}
