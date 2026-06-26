import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { PushNotificationService } from "../../push-notification.service";
import { UnregisterPushSubscriptionGqlInput } from "../inputs";
import { PushSubscriptionMutationGqlResponse } from "../responses";

@Resolver(() => PushSubscriptionMutationGqlResponse)
@UseGuards(GqlAuthGuard)
export class UnregisterPushSubscriptionMutation {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Mutation(() => PushSubscriptionMutationGqlResponse, {
    name: "unregisterPushSubscription",
    description: "Remove a Web Push subscription for the current user",
  })
  async unregisterPushSubscription(
    @Args("input") input: UnregisterPushSubscriptionGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<PushSubscriptionMutationGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    await this.pushNotificationService.unregisterSubscription(
      user.userId,
      input.endpoint,
    );

    return { success: true };
  }
}
