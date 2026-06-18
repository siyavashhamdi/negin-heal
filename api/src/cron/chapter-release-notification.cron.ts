import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { ChapterReleaseNotificationService } from "../modules/course/chapter-release-notification.service";

@Injectable()
export class ChapterReleaseNotificationCron implements OnModuleInit {
  private readonly logger = new Logger(ChapterReleaseNotificationCron.name);
  private isRunning = false;

  constructor(
    private readonly chapterReleaseNotificationService: ChapterReleaseNotificationService,
  ) {}

  onModuleInit(): void {
    void this.handleChapterReleaseNotifications();
  }

  @Cron("*/30 * * * * *")
  async handleChapterReleaseNotifications(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        "Chapter release notification cron is still running, skipping this tick",
      );
      return;
    }

    this.isRunning = true;

    try {
      await this.chapterReleaseNotificationService.processPendingNotifications();
    } catch (error) {
      this.logger.error(
        "Chapter release notification cron failed",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
