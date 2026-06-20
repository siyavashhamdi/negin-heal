import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { UserService } from "../../user.service";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { UserListGqlInput } from "../inputs";
import {
  UserListGqlResponse,
  UserListPaginatedOffsetGqlResponse,
  UserListSummaryGqlResponse,
} from "../responses";

@Resolver(() => UserListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UserListQuery {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserListPaginatedOffsetGqlResponse, {
    name: "userList",
    description:
      "Get a paginated, filterable, sortable super-admin list of users using offset-based pagination",
  })
  async findAllUsers(
    @Args("input") input: UserListGqlInput,
  ): Promise<UserListPaginatedOffsetGqlResponse> {
    return this.userService.list(input);
  }
}
