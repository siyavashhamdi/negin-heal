import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { AppSettingsService } from "./app-settings.service";
import { AppSettingUpdateMutation } from "./graphql/mutations";
import {
  AppAboutPageConfigQuery,
  AppSettingDetailQuery,
  AppSettingKeyListQuery,
  AppPrivacyPolicyPageConfigQuery,
  AppTermsOfUsePageConfigQuery,
  PaymentCheckoutConfigQuery,
  SupportContactConfigQuery,
} from "./graphql/queries";

@Module({
  imports: [DatabaseModule],
  providers: [
    AppSettingsService,
    AppAboutPageConfigQuery,
    AppSettingDetailQuery,
    AppSettingKeyListQuery,
    AppSettingUpdateMutation,
    AppPrivacyPolicyPageConfigQuery,
    AppTermsOfUsePageConfigQuery,
    PaymentCheckoutConfigQuery,
    SupportContactConfigQuery,
  ],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}
