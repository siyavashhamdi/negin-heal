import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { UserService } from "../../user.service";
import { UserPasswordResetGqlResponse } from "../responses";

@Resolver(() => UserPasswordResetGqlResponse)
export class UserActivateAccountMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserPasswordResetGqlResponse, {
    name: "userActivateAccount",
    description:
      "Activate a newly created account using the emailed activation link",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 10 })
  async activateAccount(
    @Args("token", { type: () => String }) token: string,
  ): Promise<UserPasswordResetGqlResponse> {
    return this.userService.activateAccount(token);
  }
}
