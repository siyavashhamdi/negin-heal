import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import {
  RateLimit,
  RateLimitGuard,
} from "../../../auth/guards/rate-limit.guard";
import { UserService } from "../../user.service";
import { UserRequestSignupCodeGqlInput } from "../inputs";
import { UserRequestLoginCodeGqlResponse } from "../responses";

@Resolver(() => UserRequestLoginCodeGqlResponse)
export class UserRequestSignupCodeMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserRequestLoginCodeGqlResponse, {
    name: "requestSignupCode",
    description: "Request SMS verification code for mobile signup",
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ ttl: 60, limit: 5 })
  async requestSignupCode(
    @Args("input") input: UserRequestSignupCodeGqlInput,
  ): Promise<UserRequestLoginCodeGqlResponse> {
    return this.userService.requestSignupCode(input.mobile);
  }
}
