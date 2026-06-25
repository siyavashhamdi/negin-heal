export const BACKUP_ARCHIVE_FORMAT = "rar" as const;

export type BackupRunTrigger = "cron" | "manual";

export type MinioBackupManifest = {
  version: 1;
  createdAt: string;
  archiveFormat: typeof BACKUP_ARCHIVE_FORMAT;
  bucket: string;
  objectCount: number;
  totalBytes: number;
  fileRecordCount: number;
};

export type MinioBackupResult = {
  archivePath: string;
  archivePartCount: number;
  archiveSizeBytes: number;
  objectCount: number;
  fileRecordCount: number;
  totalBytes: number;
  createdAt: Date;
  durationMs: number;
};

export type MinioListedObject = {
  objectKey: string;
  sizeBytes: number;
};

export type MongoDbCollectionBackupSummary = {
  name: string;
  documentCount: number;
};

export type MongoDbBackupManifest = {
  version: 1;
  createdAt: string;
  archiveFormat: typeof BACKUP_ARCHIVE_FORMAT;
  database: string;
  collections: MongoDbCollectionBackupSummary[];
  documentCount: number;
};

export type MongoDbBackupResult = {
  archivePath: string;
  archivePartCount: number;
  archiveSizeBytes: number;
  database: string;
  collectionCount: number;
  documentCount: number;
  collections: MongoDbCollectionBackupSummary[];
  createdAt: Date;
  durationMs: number;
};

export type BackupTelegramDeliveryResult = {
  delivered: boolean;
  messageId?: number;
  deliveryNote?: string;
};

export type BackupRunResult = {
  target: "MONGODB" | "MINIO";
  archivePath: string;
  archiveFileName: string;
  archiveFormat: typeof BACKUP_ARCHIVE_FORMAT;
  archivePartCount: number;
  archiveSizeBytes: number;
  durationMs: number;
  createdAt: Date;
  telegram: BackupTelegramDeliveryResult;
  collectionCount?: number;
  documentCount?: number;
  objectCount?: number;
  fileRecordCount?: number;
};
