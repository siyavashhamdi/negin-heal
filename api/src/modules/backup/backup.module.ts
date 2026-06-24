import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { AppSettingsModule } from "../app-settings/app-settings.module";
import { TelegramModule } from "../telegram";
import { BackupCron } from "../../cron/jobs/backup.cron";
import { BackupRunMutation } from "./graphql/mutations";
import { BackupService } from "./backup.service";

@Module({
  imports: [DatabaseModule, AppSettingsModule, TelegramModule],
  providers: [BackupService, BackupRunMutation, BackupCron],
  exports: [BackupService],
})
export class BackupModule {}
