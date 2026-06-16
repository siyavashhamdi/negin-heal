import { UseGuards } from "@nestjs/common";
import { Context, Query, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { BadgeService } from "../../badge.service";
import { BadgeCountGqlResponse } from "../responses";

@Resolver(() => BadgeCountGqlResponse)
@UseGuards(GqlAuthGuard)
export class BadgeCountQuery {
  constructor(private readonly badgeService: BadgeService) {}

  @Query(() => BadgeCountGqlResponse, {
    name: "badgeCount",
    description:
      "Get role-aware sidebar badge counts for the current logged-in user",
  })
  async getBadgeCount(
    @Context() context: GraphQLContext,
  ): Promise<BadgeCountGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    return this.badgeService.getCount(user);
  }
}
