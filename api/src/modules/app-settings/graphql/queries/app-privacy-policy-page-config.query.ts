import { Query, Resolver } from "@nestjs/graphql";

import { AppSettingsService } from "../../app-settings.service";
import { AppPrivacyPolicyPageConfigGqlResponse } from "../responses";

@Resolver(() => AppPrivacyPolicyPageConfigGqlResponse)
export class AppPrivacyPolicyPageConfigQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => AppPrivacyPolicyPageConfigGqlResponse, {
    name: "appPrivacyPolicyPageConfig",
    description: "Get configured privacy policy HTML content",
  })
  async getAppPrivacyPolicyPageConfig(): Promise<AppPrivacyPolicyPageConfigGqlResponse> {
    return this.appSettingsService.getAppPrivacyPolicyPageConfig();
  }
}
