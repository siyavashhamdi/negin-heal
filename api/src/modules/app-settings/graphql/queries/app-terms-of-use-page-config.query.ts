import { Query, Resolver } from "@nestjs/graphql";

import { AppSettingsService } from "../../app-settings.service";
import { AppTermsOfUsePageConfigGqlResponse } from "../responses";

@Resolver(() => AppTermsOfUsePageConfigGqlResponse)
export class AppTermsOfUsePageConfigQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => AppTermsOfUsePageConfigGqlResponse, {
    name: "appTermsOfUsePageConfig",
    description: "Get configured terms of use HTML content",
  })
  async getAppTermsOfUsePageConfig(): Promise<AppTermsOfUsePageConfigGqlResponse> {
    return this.appSettingsService.getAppTermsOfUsePageConfig();
  }
}
