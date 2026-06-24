import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

import { BackupTarget } from "../../../../enums";
import { BACKUP_ARCHIVE_FORMAT } from "../../backup.types";

@ObjectType()
export class BackupRunItemGqlResponse {
  @Field(() => BackupTarget, {
    description: "Backup source that was executed",
  })
  target: BackupTarget;

  @Field({
    description: `Compressed archive file name (${BACKUP_ARCHIVE_FORMAT})`,
  })
  archiveFileName: string;

  @Field({ description: "Absolute archive path on the server" })
  archivePath: string;

  @Field({
    description: "Archive compression format (password-protected RAR)",
  })
  archiveFormat: string;

  @Field(() => Int, {
    description: "Number of RAR volumes created for this backup",
  })
  archivePartCount: number;

  @Field(() => Float, { description: "Archive size in bytes" })
  archiveSizeBytes: number;

  @Field({ description: "Human-readable archive size" })
  formattedArchiveSize: string;

  @Field(() => Int, { description: "Backup duration in milliseconds" })
  durationMs: number;

  @Field({ description: "Backup creation timestamp" })
  createdAt: Date;

  @Field({
    description: "Whether the archive file was uploaded to Telegram",
  })
  telegramDelivered: boolean;

  @Field(() => Int, {
    nullable: true,
    description: "Telegram message id when delivery succeeded or fell back",
  })
  telegramMessageId?: number;

  @Field({
    nullable: true,
    description: "Extra note when Telegram file delivery was skipped",
  })
  telegramDeliveryNote?: string;

  @Field(() => Int, {
    nullable: true,
    description: "MongoDB collection count",
  })
  collectionCount?: number;

  @Field(() => Int, {
    nullable: true,
    description: "MongoDB document count",
  })
  documentCount?: number;

  @Field(() => Int, {
    nullable: true,
    description: "MinIO object count",
  })
  objectCount?: number;

  @Field(() => Int, {
    nullable: true,
    description: "Stored file record count included in MinIO backup",
  })
  fileRecordCount?: number;
}

@ObjectType()
export class BackupRunGqlResponse {
  @Field(() => [BackupRunItemGqlResponse], {
    description:
      "One item per requested backup target, each sent to Telegram separately",
  })
  items: BackupRunItemGqlResponse[];
}
