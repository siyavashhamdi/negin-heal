import { Query, Resolver } from "@nestjs/graphql";

import { AppSettingsService } from "../../app-settings.service";
import { SupportContactConfigGqlResponse } from "../responses";

@Resolver(() => SupportContactConfigGqlResponse)
export class SupportContactConfigQuery {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Query(() => SupportContactConfigGqlResponse, {
    name: "supportContactConfig",
    description: "Get configured support contact channels",
  })
  async getSupportContactConfig(): Promise<SupportContactConfigGqlResponse> {
    return this.appSettingsService.getSupportContactConfig();
  }
}
