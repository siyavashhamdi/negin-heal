import { Module } from "@nestjs/common";

import { AppSettingsModule } from "../app-settings";
import { ZarinPalProxyService } from "./zarinpal-proxy.service";

@Module({
  imports: [AppSettingsModule],
  providers: [ZarinPalProxyService],
  exports: [ZarinPalProxyService],
})
export class ZarinPalProxyModule {}
