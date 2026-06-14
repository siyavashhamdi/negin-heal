import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { UserService } from "../../user.service";
import { UserRequestLoginCodeGqlInput } from "../inputs";
import { UserResolveAuthIdentityGqlResponse } from "../responses";

@Resolver(() => UserResolveAuthIdentityGqlResponse)
export class UserResolveAuthIdentityMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserResolveAuthIdentityGqlResponse, {
    name: "resolveAuthIdentity",
    description:
      "Resolve whether an identity belongs to an existing user account",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 15 })
  async resolveAuthIdentity(
    @Args("input") input: UserRequestLoginCodeGqlInput,
  ): Promise<UserResolveAuthIdentityGqlResponse> {
    return this.userService.resolveAuthIdentity(input.identity);
  }
}
