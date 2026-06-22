import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { UserService } from "../../user.service";
import { UserResetPasswordGqlInput } from "../inputs";
import { UserPasswordResetGqlResponse } from "../responses";

@Resolver(() => UserPasswordResetGqlResponse)
export class UserResetPasswordMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserPasswordResetGqlResponse, {
    name: "userResetPassword",
    description:
      "Reset account password using the emailed one-time code and account identity",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 })
  async resetPassword(
    @Args("input") input: UserResetPasswordGqlInput,
  ): Promise<UserPasswordResetGqlResponse> {
    return this.userService.resetPassword(
      input.identity,
      input.otp,
      input.newPassword,
    );
  }
}
