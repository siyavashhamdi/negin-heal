import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { AppSettingsService } from "../../app-settings.service";
import { AppSettingDetailGqlInput } from "../inputs";
import { AppSettingMutationGqlResponse } from "../responses";

@Resolver(() => AppSettingMutationGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AppSettingDetailQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => AppSettingMutationGqlResponse, {
    name: "appSettingDetail",
    description:
      "Get full app setting data for SUPER_ADMIN, including the editable value",
  })
  async getAppSettingDetail(
    @Args("input") input: AppSettingDetailGqlInput,
  ): Promise<AppSettingMutationGqlResponse> {
    return this.appSettingsService.getDetail(input);
  }
}
