import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";

import { CronDisplayNameService } from "./cron-display-name.service";

@Injectable()
export class CronLoggingService implements OnApplicationBootstrap {
  private readonly logger = new Logger("CronJob");

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cronDisplayNameService: CronDisplayNameService,
  ) {}

  onApplicationBootstrap(): void {
    setImmediate(() => this.attachLoggingToCronJobs());
  }

  private attachLoggingToCronJobs(): void {
    for (const [name, job] of this.schedulerRegistry.getCronJobs()) {
      const displayName = this.cronDisplayNameService.resolve(name);
      const originalFireOnTick = job.fireOnTick.bind(job);

      job.fireOnTick = async (...args: unknown[]) => {
        this.logger.log(`Cronjob ${displayName} started`);
        try {
          await originalFireOnTick(...args);
        } finally {
          this.logger.log(`Cronjob ${displayName} ended`);
        }
      };
    }
  }
}
