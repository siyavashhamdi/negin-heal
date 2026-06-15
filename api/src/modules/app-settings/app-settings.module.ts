import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { AppSettingsService } from "./app-settings.service";
import {
  AppAboutPageConfigQuery,
  AppPrivacyPolicyPageConfigQuery,
  AppTermsOfUsePageConfigQuery,
  AppVersionConfigQuery,
  PaymentCheckoutConfigQuery,
  SupportContactConfigQuery,
} from "./graphql/queries";

@Module({
  imports: [DatabaseModule],
  providers: [
    AppSettingsService,
    AppAboutPageConfigQuery,
    AppPrivacyPolicyPageConfigQuery,
    AppTermsOfUsePageConfigQuery,
    AppVersionConfigQuery,
    PaymentCheckoutConfigQuery,
    SupportContactConfigQuery,
  ],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}
