import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { AppSettingsService } from "../../app-settings.service";
import { AppSettingUpdateGqlInput } from "../inputs";
import { AppSettingMutationGqlResponse } from "../responses";

@Resolver(() => AppSettingMutationGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AppSettingUpdateMutation {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Mutation(() => AppSettingMutationGqlResponse, {
    name: "appSettingUpdate",
    description:
      "Update a single app setting record, including typed value, metadata, and active status",
  })
  async updateAppSetting(
    @Args("input") input: AppSettingUpdateGqlInput,
  ): Promise<AppSettingMutationGqlResponse> {
    return this.appSettingsService.update(input);
  }
}
