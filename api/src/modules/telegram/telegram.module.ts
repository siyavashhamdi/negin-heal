import { Module } from "@nestjs/common";

import { AppSettingsModule } from "../app-settings/app-settings.module";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [AppSettingsModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
