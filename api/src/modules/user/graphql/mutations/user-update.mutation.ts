import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserService } from "../../user.service";
import { UserUpdateGqlInput } from "../inputs";
import { UserMutationGqlResponse } from "../responses";

@Resolver(() => UserMutationGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UserUpdateMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserMutationGqlResponse, {
    name: "userUpdate",
    description:
      "Update a user account, profile, preferences, avatar file, roles, status, or password",
  })
  async updateUser(
    @Args("input") input: UserUpdateGqlInput,
  ): Promise<UserMutationGqlResponse> {
    return this.userService.update(input);
  }
}
