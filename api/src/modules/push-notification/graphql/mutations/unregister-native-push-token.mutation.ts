import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { PushNotificationService } from "../../push-notification.service";
import { UnregisterNativePushTokenGqlInput } from "../inputs";
import { PushSubscriptionMutationGqlResponse } from "../responses";

@Resolver(() => PushSubscriptionMutationGqlResponse)
@UseGuards(GqlAuthGuard)
export class UnregisterNativePushTokenMutation {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Mutation(() => PushSubscriptionMutationGqlResponse, {
    name: "unregisterNativePushToken",
    description: "Remove a native mobile push token for the current user",
  })
  async unregisterNativePushToken(
    @Args("input") input: UnregisterNativePushTokenGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<PushSubscriptionMutationGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    await this.pushNotificationService.unregisterNativeToken(
      user.userId,
      input.token,
    );

    return { success: true };
  }
}
