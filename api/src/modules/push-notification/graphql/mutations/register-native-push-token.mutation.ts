import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { PushNotificationService } from "../../push-notification.service";
import { RegisterNativePushTokenGqlInput } from "../inputs";
import { PushSubscriptionMutationGqlResponse } from "../responses";

@Resolver(() => PushSubscriptionMutationGqlResponse)
@UseGuards(GqlAuthGuard)
export class RegisterNativePushTokenMutation {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Mutation(() => PushSubscriptionMutationGqlResponse, {
    name: "registerNativePushToken",
    description:
      "Register or refresh the current user's native mobile push token (FCM)",
  })
  async registerNativePushToken(
    @Args("input") input: RegisterNativePushTokenGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<PushSubscriptionMutationGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    await this.pushNotificationService.registerNativeToken({
      userId: user.userId,
      token: input.token,
      platform: input.platform,
    });

    return { success: true };
  }
}
