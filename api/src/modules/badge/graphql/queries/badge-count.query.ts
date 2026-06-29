import { UseGuards } from "@nestjs/common";
import { Context, Query, Resolver } from "@nestjs/graphql";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { OptionalGqlAuthGuard } from "../../../auth";
import { BadgeService } from "../../badge.service";
import { BadgeCountGqlResponse } from "../responses";

@Resolver(() => BadgeCountGqlResponse)
export class BadgeCountQuery {
  constructor(private readonly badgeService: BadgeService) {}

  @Query(() => BadgeCountGqlResponse, {
    name: "badgeCount",
    description:
      "Get role-aware sidebar badge counts. Anonymous users receive active product count only.",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async getBadgeCount(
    @Context() context: GraphQLContext,
  ): Promise<BadgeCountGqlResponse> {
    const user = context.req?.user ?? null;

    return this.badgeService.getCount(user);
  }
}
