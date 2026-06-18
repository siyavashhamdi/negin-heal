import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { CronDisplayNameService } from "./cron-display-name.service";
import { CronLoggingService } from "./cron-logging.service";

@Module({
  imports: [DiscoveryModule],
  providers: [CronDisplayNameService, CronLoggingService],
})
export class CronModule {}
