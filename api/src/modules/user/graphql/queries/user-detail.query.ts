import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserService } from "../../user.service";
import { UserDetailGqlInput } from "../inputs";
import { UserListGqlResponse } from "../responses";

@Resolver(() => UserListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UserDetailQuery {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserListGqlResponse, {
    name: "userDetail",
    description:
      "Get full user data for SUPER_ADMIN, including profile fields for editing",
  })
  async findUserDetail(
    @Args("input") input: UserDetailGqlInput,
  ): Promise<UserListGqlResponse> {
    return this.userService.detail(input);
  }
}
