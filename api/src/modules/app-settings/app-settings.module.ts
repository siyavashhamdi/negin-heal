import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { AppSettingsService } from "./app-settings.service";
import { PaymentCheckoutConfigQuery } from "./graphql/queries";

@Module({
  imports: [DatabaseModule],
  providers: [AppSettingsService, PaymentCheckoutConfigQuery],
  exports: [AppSettingsService],
})
export class AppSettingsModule {}
