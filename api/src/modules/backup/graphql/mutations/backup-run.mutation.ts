import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { BackupTarget, UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { BACKUP_ARCHIVE_FORMAT } from "../../backup.types";
import { BackupService } from "../../backup.service";
import { BackupRunGqlInput } from "../inputs";
import { BackupRunGqlResponse, BackupRunItemGqlResponse } from "../responses";

@Resolver(() => BackupRunGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class BackupRunMutation {
  constructor(private readonly backupService: BackupService) {}

  @Mutation(() => BackupRunGqlResponse, {
    name: "backupRun",
    description:
      "Create password-protected RAR backup archives and deliver each target to Telegram",
  })
  async runBackup(
    @Args("input") input: BackupRunGqlInput,
  ): Promise<BackupRunGqlResponse> {
    const results = await this.backupService.runBackupAndSendToTelegram(
      input.targets,
    );

    return {
      items: results.map((result) => this.toItemResponse(result)),
    };
  }

  private toItemResponse(
    result: Awaited<
      ReturnType<BackupService["runBackupAndSendToTelegram"]>
    >[number],
  ): BackupRunItemGqlResponse {
    return {
      target:
        result.target === "MONGODB" ? BackupTarget.MONGODB : BackupTarget.MINIO,
      archiveFileName: result.archiveFileName,
      archivePath: result.archivePath,
      archiveFormat: result.archiveFormat ?? BACKUP_ARCHIVE_FORMAT,
      archivePartCount: result.archivePartCount,
      archiveSizeBytes: result.archiveSizeBytes,
      formattedArchiveSize: this.formatBytes(result.archiveSizeBytes),
      durationMs: result.durationMs,
      createdAt: result.createdAt,
      telegramDelivered: result.telegram.delivered,
      telegramMessageId: result.telegram.messageId,
      telegramDeliveryNote: result.telegram.deliveryNote,
      collectionCount: result.collectionCount,
      documentCount: result.documentCount,
      objectCount: result.objectCount,
      fileRecordCount: result.fileRecordCount,
    };
  }

  private formatBytes(sizeBytes: number): string {
    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    if (sizeBytes < 1024 * 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
