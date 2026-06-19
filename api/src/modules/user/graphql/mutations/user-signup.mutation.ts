import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { UserService } from "../../user.service";
import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { buildSessionClientContext } from "../../../../utils/session-client-context.util";
import { UserSignupGqlInput } from "../inputs";
import { UserLoginGqlResponse } from "../responses";
import { UserRole } from "../../../../enums";

@Resolver(() => UserLoginGqlResponse)
export class UserSignupMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserLoginGqlResponse, {
    name: "userSignup",
    description:
      "Create an END_USER account using username/email/mobile and start a session",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 })
  async signup(
    @Args("input") input: UserSignupGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserLoginGqlResponse> {
    const signupResult = await this.userService.signup(
      input,
      buildSessionClientContext(context.req, input.clientContext),
    );

    return {
      ...signupResult,
      user: {
        ...signupResult.user,
        roles: (signupResult.user.roles || []) as UserRole[],
      },
    };
  }
}
