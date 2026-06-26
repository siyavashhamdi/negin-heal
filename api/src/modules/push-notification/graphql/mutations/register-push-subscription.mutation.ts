import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { PushNotificationService } from "../../push-notification.service";
import { RegisterPushSubscriptionGqlInput } from "../inputs";
import { PushSubscriptionMutationGqlResponse } from "../responses";

@Resolver(() => PushSubscriptionMutationGqlResponse)
@UseGuards(GqlAuthGuard)
export class RegisterPushSubscriptionMutation {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Mutation(() => PushSubscriptionMutationGqlResponse, {
    name: "registerPushSubscription",
    description: "Register or refresh the current user's Web Push subscription",
  })
  async registerPushSubscription(
    @Args("input") input: RegisterPushSubscriptionGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<PushSubscriptionMutationGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    await this.pushNotificationService.registerSubscription({
      userId: user.userId,
      endpoint: input.endpoint,
      keys: input.keys,
      replacesEndpoint: input.replacesEndpoint,
    });

    return { success: true };
  }
}
