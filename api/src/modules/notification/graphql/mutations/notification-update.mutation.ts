import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { NotificationService } from "../../notification.service";
import { NotificationUpdateGqlInput } from "../inputs";
import { NotificationUpdateGqlResponse } from "../responses";

@Resolver(() => NotificationUpdateGqlResponse)
@UseGuards(GqlAuthGuard)
export class NotificationUpdateMutation {
  constructor(private readonly notificationService: NotificationService) {}

  @Mutation(() => NotificationUpdateGqlResponse, {
    name: "userNotificationUpdate",
    description:
      "Bulk update current-user notifications by setting them read, unread, or archived",
  })
  async updateUserNotifications(
    @Args("input") input: NotificationUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<NotificationUpdateGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    return this.notificationService.update(input, user.userId);
  }
}
