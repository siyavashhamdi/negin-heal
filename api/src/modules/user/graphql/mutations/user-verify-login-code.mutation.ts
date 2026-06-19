import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { UserService } from "../../user.service";
import { UserVerifyLoginCodeGqlInput } from "../inputs";
import { UserVerifyLoginCodeGqlResponse } from "../responses";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { buildSessionClientContext } from "../../../../utils/session-client-context.util";

@Resolver(() => UserVerifyLoginCodeGqlResponse)
export class UserVerifyLoginCodeMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserVerifyLoginCodeGqlResponse, {
    name: "verifyLoginCode",
    description: "Verify SMS login code and create an authenticated session",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 })
  async verifyLoginCode(
    @Args("input") input: UserVerifyLoginCodeGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserVerifyLoginCodeGqlResponse> {
    return this.userService.verifyLoginCode(
      input.identity,
      input.code,
      input.rememberMe || false,
      buildSessionClientContext(context.req, input.clientContext),
    );
  }
}
