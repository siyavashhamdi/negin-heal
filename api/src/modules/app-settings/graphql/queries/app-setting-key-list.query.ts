import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { AppSettingsService } from "../../app-settings.service";
import { AppSettingKeyListGqlInput } from "../inputs";
import {
  AppSettingKeyListPaginatedOffsetGqlResponse,
  AppSettingKeyListSummaryGqlResponse,
} from "../responses";

@Resolver(() => AppSettingKeyListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AppSettingKeyListQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => AppSettingKeyListPaginatedOffsetGqlResponse, {
    name: "appSettingKeyList",
    description:
      "Get a paginated, filterable, sortable SUPER_ADMIN list of app setting keys using offset-based pagination",
  })
  async findAllAppSettingKeys(
    @Args("input") input: AppSettingKeyListGqlInput,
  ): Promise<AppSettingKeyListPaginatedOffsetGqlResponse> {
    return this.appSettingsService.listKeys(input);
  }
}
