import { Query, Resolver } from "@nestjs/graphql";

import { AppSettingsService } from "../../app-settings.service";
import { AppAboutPageConfigGqlResponse } from "../responses";

@Resolver(() => AppAboutPageConfigGqlResponse)
export class AppAboutPageConfigQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => AppAboutPageConfigGqlResponse, {
    name: "appAboutPageConfig",
    description: "Get configured about page HTML content",
  })
  async getAppAboutPageConfig(): Promise<AppAboutPageConfigGqlResponse> {
    return this.appSettingsService.getAppAboutPageConfig();
  }
}
