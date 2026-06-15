import { Query, Resolver } from "@nestjs/graphql";

import { AppSettingsService } from "../../app-settings.service";
import { AppVersionConfigGqlResponse } from "../responses";

@Resolver(() => AppVersionConfigGqlResponse)
export class AppVersionConfigQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => AppVersionConfigGqlResponse, {
    name: "appVersionConfig",
    description: "Get configured application version label",
  })
  async getAppVersionConfig(): Promise<AppVersionConfigGqlResponse> {
    return this.appSettingsService.getAppVersionConfig();
  }
}
