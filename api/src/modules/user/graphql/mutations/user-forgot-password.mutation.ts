import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { UserService } from "../../user.service";
import { UserForgotPasswordGqlInput } from "../inputs";
import { UserPasswordResetGqlResponse } from "../responses";

@Resolver(() => UserPasswordResetGqlResponse)
export class UserForgotPasswordMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserPasswordResetGqlResponse, {
    name: "userForgotPassword",
    description:
      "Request a password reset link using username, email, or phone number",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 })
  async forgotPassword(
    @Args("input") input: UserForgotPasswordGqlInput,
  ): Promise<UserPasswordResetGqlResponse> {
    return this.userService.forgotPassword(input);
  }
}
