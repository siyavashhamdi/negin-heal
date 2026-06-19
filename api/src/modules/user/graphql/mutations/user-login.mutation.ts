import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver, Context } from "@nestjs/graphql";

import { UserService } from "../../user.service";
import {
  RateLimitGuard,
  RateLimit,
} from "../../../auth/guards/rate-limit.guard";
import { UserLoginGqlInput } from "../inputs";
import { UserLoginGqlResponse } from "../responses";
import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { buildSessionClientContext } from "../../../../utils/session-client-context.util";

@Resolver(() => UserLoginGqlResponse)
export class UserLoginMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserLoginGqlResponse, {
    name: "userLogin",
    description: "Login and get JWT access token",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 }) // 5 login attempts per minute per IP
  async login(
    @Args("input") input: UserLoginGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserLoginGqlResponse> {
    const loginResult = await this.userService.login(
      input.identity,
      input.password,
      input.captchaId,
      input.captchaValue,
      input.rememberMe || false,
      buildSessionClientContext(context.req, input.clientContext),
    );

    // Cast roles to UserRole array for GraphQL response
    return {
      ...loginResult,
      user: {
        ...loginResult.user,
        roles: (loginResult.user.roles || []) as UserRole[],
      },
    };
  }
}
