import { UseGuards } from "@nestjs/common";
import { Context, Mutation, Resolver } from "@nestjs/graphql";

import { GqlAuthGuard } from "../../../auth";
import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { UserService } from "../../user.service";
import { UserPasswordResetGqlResponse } from "../responses";

@Resolver(() => UserPasswordResetGqlResponse)
export class UserRequestEmailVerificationMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserPasswordResetGqlResponse, {
    name: "userRequestEmailVerification",
    description:
      "Send a verification email to the authenticated user's address",
  })
  @UseGuards(GqlAuthGuard, RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 })
  async requestEmailVerification(
    @Context() context: GraphQLContext,
  ): Promise<UserPasswordResetGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);
    return this.userService.requestEmailVerification(user.userId);
  }
}
