import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserService } from "../../user.service";
import { UserCreateGqlInput } from "../inputs";
import { UserMutationGqlResponse } from "../responses";

@Resolver(() => UserMutationGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UserCreateMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserMutationGqlResponse, {
    name: "userCreate",
    description:
      "Create a user account with profile, avatar file, roles, status, and initial password",
  })
  async createUser(
    @Args("input") input: UserCreateGqlInput,
  ): Promise<UserMutationGqlResponse> {
    return this.userService.create(input);
  }
}
