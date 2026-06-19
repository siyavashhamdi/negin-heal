import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { UnreferencedFileCleanupService } from "../../modules/file/unreferenced-file-cleanup.service";

@Injectable()
export class UnreferencedFileCleanupCron {
  private readonly logger = new Logger(UnreferencedFileCleanupCron.name);
  private isRunning = false;

  constructor(
    private readonly unreferencedFileCleanupService: UnreferencedFileCleanupService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: "unreferenced-file-cleanup",
    timeZone: "UTC",
  })
  async handleUnreferencedFileCleanup(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        "Unreferenced file cleanup cron is still running, skipping this tick",
      );
      return;
    }

    this.isRunning = true;

    try {
      const result =
        await this.unreferencedFileCleanupService.removeUnreferencedFiles();
      this.logger.log(
        `Unreferenced file cleanup finished: referenced=${result.referencedFileCount}, clearedUnavailableReferences=${result.clearedUnavailableReferenceCount}, deletedUnreferenced=${result.deletedUnreferencedFileCount}, deletedUnreferencedDbOnly=${result.deletedUnreferencedDbOnlyCount}, deletedMinioOrphans=${result.deletedMinioOrphanCount}`,
      );
    } catch (error) {
      this.logger.error(
        "Unreferenced file cleanup cron failed",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
