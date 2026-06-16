import { UseGuards } from "@nestjs/common";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { NotificationService } from "../../notification.service";
import { NotificationListGqlInput } from "../inputs";
import {
  NotificationListGqlResponse,
  NotificationListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => NotificationListGqlResponse)
@UseGuards(GqlAuthGuard)
export class NotificationListQuery {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => NotificationListPaginatedCursorGqlResponse, {
    name: "userNotificationList",
    description:
      "Get a cursor-paginated, filterable, sortable list of notifications visible to the current user",
  })
  async findUserNotifications(
    @Args("input") input: NotificationListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<NotificationListPaginatedCursorGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    return this.notificationService.list(input, user.userId);
  }
}
