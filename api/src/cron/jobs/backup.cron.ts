import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { BACKUP_CONSTANT } from "../../constants/backup.constant";
import { BackupTarget } from "../../enums";
import { BackupService } from "../../modules/backup/backup.service";

/** Saturday 00:00 — not provided by `CronExpression`. */
const EVERY_SATURDAY_AT_MIDNIGHT = "0 0 * * 6";

@Injectable()
export class BackupCron {
  private readonly logger = new Logger(BackupCron.name);
  private isMongoDbCronRunning = false;
  private isMinioCronRunning = false;

  constructor(private readonly backupService: BackupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: "mongodb-backup-daily",
    timeZone: BACKUP_CONSTANT.CRON_TIMEZONE,
  })
  async handleMongoDbBackup(): Promise<void> {
    await this.runScheduledBackup({
      target: BackupTarget.MONGODB,
      label: "MongoDB",
      isRunning: () => this.isMongoDbCronRunning,
      setRunning: (value) => {
        this.isMongoDbCronRunning = value;
      },
    });
  }

  @Cron(EVERY_SATURDAY_AT_MIDNIGHT, {
    name: "minio-backup-weekly",
    timeZone: BACKUP_CONSTANT.CRON_TIMEZONE,
  })
  async handleMinioBackup(): Promise<void> {
    await this.waitForBackupIdle();

    await this.runScheduledBackup({
      target: BackupTarget.MINIO,
      label: "MinIO",
      isRunning: () => this.isMinioCronRunning,
      setRunning: (value) => {
        this.isMinioCronRunning = value;
      },
    });
  }

  private async runScheduledBackup(input: {
    target: BackupTarget;
    label: string;
    isRunning: () => boolean;
    setRunning: (value: boolean) => void;
  }): Promise<void> {
    if (input.isRunning()) {
      this.logger.warn(
        `${input.label} backup cron is still running, skipping this tick`,
      );
      return;
    }

    if (this.backupService.isBackupRunActive()) {
      this.logger.warn(
        `${input.label} backup cron skipped because another backup is already in progress`,
      );
      return;
    }

    input.setRunning(true);

    try {
      const results = await this.backupService.runBackupAndSendToTelegram(
        [input.target],
        "cron",
      );
      const result = results[0];

      this.logger.log(
        `Scheduled ${input.label} backup finished: archive=${result.archiveFileName}, parts=${result.archivePartCount}, sizeBytes=${result.archiveSizeBytes}, telegramDelivered=${result.telegram.delivered}, durationMs=${result.durationMs}`,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(
          `${input.label} backup cron skipped because a backup is already in progress`,
        );
        return;
      }

      if (error instanceof RequestTimeoutException) {
        this.logger.error(`${input.label} backup cron timed out`);
        return;
      }

      if (error instanceof InternalServerErrorException) {
        this.logger.error(
          `${input.label} backup cron failed: ${String(error.getResponse())}`,
        );
        return;
      }

      this.logger.error(
        `${input.label} backup cron failed`,
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      input.setRunning(false);
    }
  }

  private async waitForBackupIdle(): Promise<void> {
    const deadline = Date.now() + BACKUP_CONSTANT.CRON_WAIT_FOR_IDLE_MS;

    while (this.backupService.isBackupRunActive()) {
      if (Date.now() >= deadline) {
        this.logger.warn(
          "MinIO backup cron stopped waiting for another backup run to finish",
        );
        return;
      }

      this.logger.log(
        "MinIO backup cron waiting for another backup run to finish",
      );

      await this.sleep(BACKUP_CONSTANT.CRON_WAIT_POLL_INTERVAL_MS);
    }
  }

  private sleep(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}
