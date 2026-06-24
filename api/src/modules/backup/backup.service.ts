import { spawn } from "child_process";
import { once } from "events";
import { createWriteStream } from "fs";
import { mkdir, readdir, rm, stat, writeFile } from "fs/promises";
import { basename, dirname, join } from "path";
import { finished } from "stream/promises";
import { pipeline } from "stream/promises";
import { Client as MinioClient } from "minio";
import { Connection, Model } from "mongoose";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from "@nestjs/common";

import { BackupTarget } from "../../enums";
import { env } from "../../config";
import { BACKUP_CONSTANT } from "../../constants/backup.constant";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { StoredFile, StoredFileDocument } from "../../database/schemas";
import { TelegramService } from "../telegram";
import {
  BACKUP_ARCHIVE_FORMAT,
  BackupRunResult,
  BackupTelegramDeliveryResult,
  MinioBackupManifest,
  MinioBackupResult,
  MinioListedObject,
  MongoDbBackupManifest,
  MongoDbBackupResult,
  MongoDbCollectionBackupSummary,
} from "./backup.types";

type BackupKind = "minio" | "mongodb";

type BackupArchivePaths = {
  archivePath: string;
  archiveFileName: string;
  stagingDir: string;
};

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly minioClient: MinioClient;
  private isBackupRunInProgress = false;
  private isMinioBackupRunning = false;
  private isMongoDbBackupRunning = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    private readonly telegramService: TelegramService,
  ) {
    this.minioClient = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  isBackupRunActive(): boolean {
    return this.isBackupRunInProgress;
  }

  async runBackupAndSendToTelegram(
    targets: BackupTarget[],
  ): Promise<BackupRunResult[]> {
    if (this.isBackupRunInProgress) {
      throw new ConflictException(
        EXCEPTION_CONSTANT.BACKUP_ALREADY_IN_PROGRESS,
      );
    }

    const uniqueTargets = [...new Set(targets)];
    let runTimedOut = false;
    let timeoutId: NodeJS.Timeout | undefined;

    await this.ensureRarReadyForBackup();
    await this.clearBackupTempDir("before");
    this.isBackupRunInProgress = true;

    const workPromise = this.executeBackupRun(uniqueTargets, () => runTimedOut);
    void workPromise.catch((error) => {
      if (!runTimedOut) {
        return;
      }

      this.logger.warn(
        "Background backup run ended after timeout",
        error instanceof Error ? error.message : String(error),
      );
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        runTimedOut = true;
        void this.notifyBackupRunTimedOut(uniqueTargets).finally(() => {
          this.isBackupRunInProgress = false;
        });
        reject(
          new RequestTimeoutException(EXCEPTION_CONSTANT.BACKUP_TIMED_OUT),
        );
      }, BACKUP_CONSTANT.RUN_TIMEOUT_MS);
    });

    try {
      return await Promise.race([workPromise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!runTimedOut) {
        await this.clearBackupTempDir("after");
        this.isBackupRunInProgress = false;
      }
    }
  }

  private async executeBackupRun(
    uniqueTargets: BackupTarget[],
    isTimedOut: () => boolean,
  ): Promise<BackupRunResult[]> {
    const results: BackupRunResult[] = [];

    for (const target of uniqueTargets) {
      if (isTimedOut()) {
        this.logger.warn(
          `Skipping remaining backup targets after timeout: ${target}`,
        );
        break;
      }

      switch (target) {
        case BackupTarget.MONGODB:
          results.push(
            await this.runMongoDbBackupAndSendToTelegram(isTimedOut),
          );
          break;
        case BackupTarget.MINIO:
          results.push(await this.runMinioBackupAndSendToTelegram(isTimedOut));
          break;
        default:
          throw new BadRequestException(EXCEPTION_CONSTANT.VALIDATION_FAILED);
      }
    }

    return results;
  }

  private async runMongoDbBackupAndSendToTelegram(
    isTimedOut: () => boolean,
  ): Promise<BackupRunResult> {
    const backupResult = await this.backupMongoDb(isTimedOut);
    const telegram = await this.deliverMongoDbBackupToTelegram(backupResult);
    const archiveFileName = basename(backupResult.archivePath);

    return {
      target: "MONGODB",
      archivePath: backupResult.archivePath,
      archiveFileName,
      archiveFormat: BACKUP_ARCHIVE_FORMAT,
      archivePartCount: backupResult.archivePartCount,
      archiveSizeBytes: backupResult.archiveSizeBytes,
      durationMs: backupResult.durationMs,
      createdAt: backupResult.createdAt,
      collectionCount: backupResult.collectionCount,
      documentCount: backupResult.documentCount,
      telegram,
    };
  }

  private async runMinioBackupAndSendToTelegram(
    isTimedOut: () => boolean,
  ): Promise<BackupRunResult> {
    const backupResult = await this.backupMinio(isTimedOut);
    const telegram = await this.deliverMinioBackupToTelegram(backupResult);
    const archiveFileName = basename(backupResult.archivePath);

    return {
      target: "MINIO",
      archivePath: backupResult.archivePath,
      archiveFileName,
      archiveFormat: BACKUP_ARCHIVE_FORMAT,
      archivePartCount: backupResult.archivePartCount,
      archiveSizeBytes: backupResult.archiveSizeBytes,
      durationMs: backupResult.durationMs,
      createdAt: backupResult.createdAt,
      objectCount: backupResult.objectCount,
      fileRecordCount: backupResult.fileRecordCount,
      telegram,
    };
  }

  private async notifyBackupRunTimedOut(
    targets: readonly BackupTarget[],
  ): Promise<void> {
    const targetLabels = targets
      .map((target) => this.formatBackupTargetLabel(target))
      .join("، ");
    const timeoutMinutes = Math.round(BACKUP_CONSTANT.RUN_TIMEOUT_MS / 60_000);

    try {
      await this.telegramService.sendMessage({
        text: [
          "⏱ پشتیبان‌گیری Negin Heal — اتمام زمان",
          "",
          `اهداف درخواستی: ${targetLabels}`,
          `حداکثر زمان مجاز: ${timeoutMinutes} دقیقه`,
          `زمان: ${this.formatDateTime(new Date())}`,
          "",
          "عملیات از سمت API متوقف شد. در صورت نیاز دوباره تلاش کنید.",
        ].join("\n"),
        disableWebPagePreview: true,
      });
    } catch (error) {
      this.logger.error(
        "Failed to send backup timeout notification to Telegram",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private formatBackupTargetLabel(target: BackupTarget): string {
    switch (target) {
      case BackupTarget.MONGODB:
        return "MongoDB";
      case BackupTarget.MINIO:
        return "MinIO";
      default:
        return target;
    }
  }

  async backupMinio(
    isTimedOut: () => boolean = () => false,
  ): Promise<MinioBackupResult> {
    this.isMinioBackupRunning = true;
    const startedAt = Date.now();
    const createdAt = new Date();
    const bucket = env.MINIO_BUCKET;
    const { archivePath, stagingDir } = this.buildBackupArchivePaths(
      "minio",
      createdAt,
    );

    try {
      await mkdir(stagingDir, { recursive: true });

      const fileRecords = await this.storedFileModel.find().lean().exec();
      const objects = await this.listMinioObjects(bucket);

      await writeFile(
        join(stagingDir, "files.json"),
        JSON.stringify(fileRecords, null, 2),
        "utf8",
      );

      const manifest: MinioBackupManifest = {
        version: 1,
        createdAt: createdAt.toISOString(),
        archiveFormat: BACKUP_ARCHIVE_FORMAT,
        bucket,
        objectCount: objects.length,
        totalBytes: objects.reduce(
          (total, object) => total + object.sizeBytes,
          0,
        ),
        fileRecordCount: fileRecords.length,
      };

      await writeFile(
        join(stagingDir, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf8",
      );

      const objectsDir = join(stagingDir, "objects");
      await mkdir(objectsDir, { recursive: true });

      for (const object of objects) {
        if (isTimedOut()) {
          throw new RequestTimeoutException(EXCEPTION_CONSTANT.BACKUP_TIMED_OUT);
        }

        await this.downloadMinioObject(bucket, object.objectKey, objectsDir);
      }

      await this.createRarArchive(stagingDir, archivePath);
      await rm(stagingDir, { recursive: true, force: true });

      const archiveParts = await this.listRarArchiveParts(archivePath);
      const archiveSizeBytes = await this.sumFileSizes(archiveParts);
      const durationMs = Date.now() - startedAt;

      this.logger.log(
        `MinIO backup completed: archive=${archivePath}, parts=${archiveParts.length}, objects=${manifest.objectCount}, fileRecords=${manifest.fileRecordCount}, sizeBytes=${archiveSizeBytes}, durationMs=${durationMs}`,
      );

      return {
        archivePath,
        archivePartCount: archiveParts.length,
        archiveSizeBytes,
        objectCount: manifest.objectCount,
        fileRecordCount: manifest.fileRecordCount,
        totalBytes: manifest.totalBytes,
        createdAt,
        durationMs,
      };
    } catch (error) {
      await this.clearBackupTempDir("after");

      if (error instanceof RequestTimeoutException) {
        throw error;
      }

      if (this.isKnownBackupConfigurationError(error)) {
        throw error;
      }

      this.logger.error(
        "MinIO backup failed",
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    } finally {
      this.isMinioBackupRunning = false;
    }
  }

  async backupMongoDb(
    isTimedOut: () => boolean = () => false,
  ): Promise<MongoDbBackupResult> {
    if (!this.connection.db) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    }

    this.isMongoDbBackupRunning = true;
    const startedAt = Date.now();
    const createdAt = new Date();
    const database = env.MONGODB_DATABASE;
    const { archivePath, stagingDir } = this.buildBackupArchivePaths(
      "mongodb",
      createdAt,
    );

    try {
      await mkdir(stagingDir, { recursive: true });

      const collectionNames = await this.listMongoDbCollectionNames();
      this.logger.log(
        `MongoDB backup started: database=${database}, collections=${collectionNames.length}`,
      );

      const collections: MongoDbCollectionBackupSummary[] = [];

      for (const collectionName of collectionNames) {
        if (isTimedOut()) {
          throw new RequestTimeoutException(EXCEPTION_CONSTANT.BACKUP_TIMED_OUT);
        }

        const documentCount = await this.exportMongoDbCollection(
          collectionName,
          join(stagingDir, `${collectionName}.json`),
        );

        collections.push({
          name: collectionName,
          documentCount,
        });
      }

      const documentCount = collections.reduce(
        (total, collection) => total + collection.documentCount,
        0,
      );

      const manifest: MongoDbBackupManifest = {
        version: 1,
        createdAt: createdAt.toISOString(),
        archiveFormat: BACKUP_ARCHIVE_FORMAT,
        database,
        collections,
        documentCount,
      };

      await writeFile(
        join(stagingDir, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf8",
      );

      this.logger.log(
        `MongoDB JSON export finished: database=${database}, documents=${documentCount}, starting RAR archive`,
      );

      await this.createRarArchive(stagingDir, archivePath);
      await rm(stagingDir, { recursive: true, force: true });

      const archiveParts = await this.listRarArchiveParts(archivePath);
      const archiveSizeBytes = await this.sumFileSizes(archiveParts);
      const durationMs = Date.now() - startedAt;

      this.logger.log(
        `MongoDB backup completed: archive=${archivePath}, parts=${archiveParts.length}, database=${database}, collections=${collections.length}, documents=${documentCount}, sizeBytes=${archiveSizeBytes}, durationMs=${durationMs}`,
      );

      return {
        archivePath,
        archivePartCount: archiveParts.length,
        archiveSizeBytes,
        database,
        collectionCount: collections.length,
        documentCount,
        collections,
        createdAt,
        durationMs,
      };
    } catch (error) {
      await this.clearBackupTempDir("after");

      if (error instanceof RequestTimeoutException) {
        throw error;
      }

      if (this.isKnownBackupConfigurationError(error)) {
        throw error;
      }

      this.logger.error(
        "MongoDB backup failed",
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    } finally {
      this.isMongoDbBackupRunning = false;
    }
  }

  private buildBackupArchivePaths(
    kind: BackupKind,
    createdAt: Date,
  ): BackupArchivePaths {
    const timestamp = this.formatBackupTimestamp(createdAt);
    const archiveFileName = `negin-heal-${kind}-backup_${timestamp}.rar`;
    const stagingDir = join(
      BACKUP_CONSTANT.DIR,
      `negin-heal-${kind}-backup-staging_${timestamp}`,
    );

    return {
      archiveFileName,
      archivePath: join(BACKUP_CONSTANT.DIR, archiveFileName),
      stagingDir,
    };
  }

  private formatBackupTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  private async deliverMongoDbBackupToTelegram(
    backupResult: MongoDbBackupResult,
  ): Promise<BackupTelegramDeliveryResult> {
    const archiveFileName = basename(backupResult.archivePath);
    this.assertRarArchive(archiveFileName, backupResult.archivePath);
    const caption = this.buildMongoDbBackupTelegramCaption(
      backupResult,
      archiveFileName,
    );

    return this.deliverRarArchivePartsToTelegram({
      archivePath: backupResult.archivePath,
      caption,
      targetLabel: "MongoDB",
    });
  }

  private async deliverMinioBackupToTelegram(
    backupResult: MinioBackupResult,
  ): Promise<BackupTelegramDeliveryResult> {
    const archiveFileName = basename(backupResult.archivePath);
    this.assertRarArchive(archiveFileName, backupResult.archivePath);
    const caption = this.buildMinioBackupTelegramCaption(
      backupResult,
      archiveFileName,
    );

    return this.deliverRarArchivePartsToTelegram({
      archivePath: backupResult.archivePath,
      caption,
      targetLabel: "MinIO",
    });
  }

  private async deliverRarArchivePartsToTelegram(input: {
    archivePath: string;
    caption: string;
    targetLabel: string;
  }): Promise<BackupTelegramDeliveryResult> {
    const archiveParts = await this.listRarArchiveParts(input.archivePath);
    const oversizedParts = await this.findOversizedTelegramParts(archiveParts);

    if (oversizedParts.length > 0) {
      await this.notifyBackupArchivePartTooLargeForTelegram(
        input.targetLabel,
        oversizedParts,
      );
      await this.clearBackupTempDir("after");

      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    }

    let lastMessageId: number | undefined;
    const totalParts = archiveParts.length;

    for (const [index, partPath] of archiveParts.entries()) {
      const partName = basename(partPath);
      const partCaption =
        totalParts === 1
          ? input.caption
          : index === 0
            ? `${input.caption}\n\n📦 قسمت ${index + 1} از ${totalParts}`
            : [
                `📦 پشتیبان‌گیری ${input.targetLabel} — Negin Heal`,
                `📁 ${partName}`,
                `📦 قسمت ${index + 1} از ${totalParts}`,
              ].join("\n");

      const message = await this.telegramService.sendDocument({
        media: {
          filePath: partPath,
          fileName: partName,
          contentType: "application/x-rar-compressed",
        },
        caption: partCaption,
      });
      lastMessageId = message.messageId;
    }

    await this.clearBackupTempDir("after");

    return {
      delivered: true,
      messageId: lastMessageId,
      ...(totalParts > 1
        ? { deliveryNote: `${totalParts} قسمت آرشیو RAR به تلگرام ارسال شد.` }
        : {}),
    };
  }

  private buildMinioBackupTelegramCaption(
    backupResult: MinioBackupResult,
    archiveFileName: string,
  ): string {
    return [
      "📦 پشتیبان‌گیری MinIO — Negin Heal",
      "",
      `🪣 باکت: ${env.MINIO_BUCKET}`,
      `📁 فایل: ${archiveFileName}`,
      `🗜 فرمت آرشیو: ${BACKUP_ARCHIVE_FORMAT} (رمزدار)`,
      `📦 تعداد قسمت‌ها: ${backupResult.archivePartCount.toLocaleString("en-US")}`,
      `📊 حجم آرشیو: ${this.formatBytes(backupResult.archiveSizeBytes)}`,
      `🗂 تعداد آبجکت‌ها: ${backupResult.objectCount.toLocaleString("en-US")}`,
      `📎 رکوردهای files: ${backupResult.fileRecordCount.toLocaleString("en-US")}`,
      `💾 حجم خام آبجکت‌ها: ${this.formatBytes(backupResult.totalBytes)}`,
      `⏱ مدت پشتیبان‌گیری: ${this.formatDuration(backupResult.durationMs)}`,
      `🕐 زمان ایجاد: ${this.formatDateTime(backupResult.createdAt)}`,
      "",
      "✅ محتوا: manifest.json + files.json + پوشه objects/",
      "♻️ بازیابی: extract همه قسمت‌های RAR → mc mirror ./objects/ local/<bucket>",
    ].join("\n");
  }

  private buildMongoDbBackupTelegramCaption(
    backupResult: MongoDbBackupResult,
    archiveFileName: string,
  ): string {
    const collectionSummary = this.summarizeMongoDbCollections(
      backupResult.collections,
    );

    return [
      "📦 پشتیبان‌گیری MongoDB — Negin Heal",
      "",
      `🗄 پایگاه داده: ${backupResult.database}`,
      `📁 فایل: ${archiveFileName}`,
      `🗜 فرمت آرشیو: ${BACKUP_ARCHIVE_FORMAT} (رمزدار)`,
      `📦 تعداد قسمت‌ها: ${backupResult.archivePartCount.toLocaleString("en-US")}`,
      `📊 حجم آرشیو: ${this.formatBytes(backupResult.archiveSizeBytes)}`,
      `📚 تعداد کالکشن‌ها: ${backupResult.collectionCount}`,
      `📄 تعداد سندها: ${backupResult.documentCount.toLocaleString("en-US")}`,
      `⏱ مدت پشتیبان‌گیری: ${this.formatDuration(backupResult.durationMs)}`,
      `🕐 زمان ایجاد: ${this.formatDateTime(backupResult.createdAt)}`,
      "",
      "📋 پرحجم‌ترین کالکشن‌ها:",
      collectionSummary,
      "",
      "✅ محتوا: manifest.json + خروجی JSON همه کالکشن‌ها",
      "♻️ بازیابی: extract همه قسمت‌های RAR → mongoimport --jsonArray",
    ].join("\n");
  }

  private summarizeMongoDbCollections(
    collections: MongoDbCollectionBackupSummary[],
  ): string {
    const sortedCollections = [...collections].sort(
      (left, right) => right.documentCount - left.documentCount,
    );
    const topCollections = sortedCollections.slice(0, 5);
    const lines = topCollections.map(
      (collection) =>
        `• ${collection.name}: ${collection.documentCount.toLocaleString("en-US")}`,
    );
    const remainingCount = sortedCollections.length - topCollections.length;

    if (remainingCount > 0) {
      lines.push(`• ... و ${remainingCount} کالکشن دیگر`);
    }

    return lines.join("\n");
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

  private formatDuration(durationMs: number): string {
    if (durationMs < 1000) {
      return `${durationMs} ms`;
    }

    const totalSeconds = durationMs / 1000;
    if (totalSeconds < 60) {
      return `${totalSeconds.toFixed(1)} s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  private async clearBackupTempDir(phase: "before" | "after"): Promise<void> {
    try {
      await mkdir(BACKUP_CONSTANT.DIR, { recursive: true });

      const entries = await readdir(BACKUP_CONSTANT.DIR, { withFileTypes: true });
      if (entries.length === 0) {
        this.logger.log(
          `Backup temp dir already empty (${phase}): ${BACKUP_CONSTANT.DIR}`,
        );
        return;
      }

      for (const entry of entries) {
        await rm(join(BACKUP_CONSTANT.DIR, entry.name), {
          recursive: true,
          force: true,
        });
      }

      this.logger.log(
        `Cleared backup temp dir (${phase}): ${BACKUP_CONSTANT.DIR}, removedEntries=${entries.length}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to clear backup temp dir (${phase}): ${BACKUP_CONSTANT.DIR}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async listMongoDbCollectionNames(): Promise<string[]> {
    const collections = await this.connection.db!.listCollections().toArray();

    return collections
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith("system."))
      .sort((left, right) => left.localeCompare(right));
  }

  private async exportMongoDbCollection(
    collectionName: string,
    outputPath: string,
  ): Promise<number> {
    const collection = this.connection.db!.collection(collectionName);
    const estimatedDocumentCount = await collection.estimatedDocumentCount();
    const startedAt = Date.now();

    this.logger.log(
      `Exporting MongoDB collection: ${collectionName}, estimatedDocuments=${estimatedDocumentCount}`,
    );

    if (
      estimatedDocumentCount <=
      BACKUP_CONSTANT.MONGODB_EXPORT_IN_MEMORY_MAX_DOCUMENTS
    ) {
      const documents = await collection.find({}).toArray();
      await writeFile(outputPath, JSON.stringify(documents), "utf8");

      this.logger.log(
        `Exported MongoDB collection: ${collectionName}, documents=${documents.length}, durationMs=${Date.now() - startedAt}`,
      );

      return documents.length;
    }

    const documentCount = await this.exportMongoDbCollectionStreaming(
      collection,
      outputPath,
    );

    this.logger.log(
      `Exported MongoDB collection (stream): ${collectionName}, documents=${documentCount}, durationMs=${Date.now() - startedAt}`,
    );

    return documentCount;
  }

  private async exportMongoDbCollectionStreaming(
    collection: ReturnType<NonNullable<Connection["db"]>["collection"]>,
    outputPath: string,
  ): Promise<number> {
    const cursor = collection
      .find({})
      .batchSize(BACKUP_CONSTANT.MONGODB_EXPORT_BATCH_SIZE);
    const writeStream = createWriteStream(outputPath, { encoding: "utf8" });

    let documentCount = 0;
    writeStream.write("[");

    for await (const document of cursor) {
      if (documentCount > 0) {
        writeStream.write(",");
      }

      if (!writeStream.write(JSON.stringify(document))) {
        await once(writeStream, "drain");
      }

      documentCount += 1;

      if (
        documentCount % BACKUP_CONSTANT.MONGODB_EXPORT_BATCH_SIZE ===
        0
      ) {
        this.logger.log(
          `Exporting MongoDB collection ${collection.collectionName}: ${documentCount} documents written`,
        );
      }
    }

    writeStream.write("]");
    await finished(writeStream);

    return documentCount;
  }

  private async listMinioObjects(bucket: string): Promise<MinioListedObject[]> {
    return new Promise((resolve, reject) => {
      const objects: MinioListedObject[] = [];
      const stream = this.minioClient.listObjectsV2(bucket, "", true);

      stream.on("data", (object) => {
        if (!object.name) {
          return;
        }

        objects.push({
          objectKey: object.name,
          sizeBytes: object.size ?? 0,
        });
      });
      stream.on("error", reject);
      stream.on("end", () => resolve(objects));
    });
  }

  private async downloadMinioObject(
    bucket: string,
    objectKey: string,
    objectsDir: string,
  ): Promise<void> {
    const destinationPath = join(objectsDir, objectKey);
    await mkdir(dirname(destinationPath), { recursive: true });

    const objectStream = await this.minioClient.getObject(bucket, objectKey);
    await pipeline(objectStream, createWriteStream(destinationPath));
  }

  private async createRarArchive(
    sourceDir: string,
    archivePath: string,
  ): Promise<string[]> {
    this.assertRarArchive(basename(archivePath), archivePath);
    const password = await this.getRarPasswordOrThrow();

    this.logger.log(
      `Creating ${BACKUP_ARCHIVE_FORMAT} archive: source=${sourceDir}, archive=${archivePath}, volumeSize=${BACKUP_CONSTANT.RAR_VOLUME_SIZE}`,
    );

    await this.runRarProcess([
      "a",
      `-v${BACKUP_CONSTANT.RAR_VOLUME_SIZE}`,
      `-hp${password}`,
      "-r",
      `-m${BACKUP_CONSTANT.RAR_COMPRESSION_LEVEL}`,
      archivePath,
      sourceDir,
    ]);

    const archiveParts = await this.listRarArchiveParts(archivePath);
    if (archiveParts.length === 0) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    }

    return archiveParts;
  }

  private async ensureRarReadyForBackup(): Promise<void> {
    const password = env.BACKUP_RAR_PASSWORD?.trim();
    if (!password) {
      await this.notifyRarPasswordNotConfigured();
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_RAR_PASSWORD_NOT_CONFIGURED,
      );
    }

    const isInstalled = await this.isRarInstalled();
    if (!isInstalled) {
      await this.notifyRarNotInstalled();
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_RAR_NOT_INSTALLED,
      );
    }
  }

  private async getRarPasswordOrThrow(): Promise<string> {
    const password = env.BACKUP_RAR_PASSWORD?.trim();
    if (password) {
      return password;
    }

    await this.notifyRarPasswordNotConfigured();
    throw new InternalServerErrorException(
      EXCEPTION_CONSTANT.BACKUP_RAR_PASSWORD_NOT_CONFIGURED,
    );
  }

  private async notifyBackupArchivePartTooLargeForTelegram(
    targetLabel: string,
    oversizedParts: string[],
  ): Promise<void> {
    const partLines = oversizedParts.map(
      (partPath) => `• ${basename(partPath)}`,
    );

    this.logger.error(
      `Backup archive part exceeds Telegram limit (${targetLabel}): ${oversizedParts.join(", ")}`,
    );

    try {
      await this.telegramService.sendMessage({
        text: [
          "❌ پشتیبان‌گیری Negin Heal — خطا",
          "",
          `هدف: ${targetLabel}`,
          "حداقل یک قسمت آرشیو از حد مجاز تلگرام (۵۰ مگابایت) بزرگ‌تر است.",
          "فایل‌ها از سرور حذف شدند. لطفاً با مدیر سیستم تماس بگیرید.",
          "",
          "قسمت‌های مشکل‌دار:",
          ...partLines,
          "",
          `زمان: ${this.formatDateTime(new Date())}`,
        ].join("\n"),
        disableWebPagePreview: true,
      });
    } catch (error) {
      this.logger.error(
        "Failed to send oversized backup archive notification to Telegram",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyRarNotInstalled(): Promise<void> {
    this.logger.error(
      "RAR is not installed on the server. Install RAR and retry backup.",
    );

    try {
      await this.telegramService.sendMessage({
        text: [
          "❌ پشتیبان‌گیری Negin Heal — خطا",
          "",
          "ابزار rar روی سرور نصب نیست.",
          "لطفاً RAR را نصب کنید و دوباره تلاش کنید.",
          `زمان: ${this.formatDateTime(new Date())}`,
        ].join("\n"),
        disableWebPagePreview: true,
      });
    } catch (error) {
      this.logger.error(
        "Failed to send RAR-not-installed notification to Telegram",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyRarPasswordNotConfigured(): Promise<void> {
    this.logger.error(
      "BACKUP_RAR_PASSWORD is not configured. Set it in the API environment and retry backup.",
    );

    try {
      await this.telegramService.sendMessage({
        text: [
          "❌ پشتیبان‌گیری Negin Heal — خطا",
          "",
          "رمز آرشیو پشتیبان (BACKUP_RAR_PASSWORD) در تنظیمات API تعریف نشده است.",
          "لطفاً متغیر محیطی را تنظیم کنید و دوباره تلاش کنید.",
          `زمان: ${this.formatDateTime(new Date())}`,
        ].join("\n"),
        disableWebPagePreview: true,
      });
    } catch (error) {
      this.logger.error(
        "Failed to send backup password notification to Telegram",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private isKnownBackupConfigurationError(error: unknown): boolean {
    if (!(error instanceof InternalServerErrorException)) {
      return false;
    }

    const response = error.getResponse();
    return (
      response === EXCEPTION_CONSTANT.BACKUP_RAR_NOT_INSTALLED ||
      response === EXCEPTION_CONSTANT.BACKUP_RAR_PASSWORD_NOT_CONFIGURED
    );
  }

  private isRarInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (installed: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(installed);
      };

      const rarProcess = spawn("rar");
      rarProcess.on("error", (error: NodeJS.ErrnoException) => {
        finish(error.code === "ENOENT" ? false : true);
      });
      rarProcess.on("close", () => finish(true));
    });
  }

  private async runRarProcess(args: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const stderrChunks: Buffer[] = [];
      const rarProcess = spawn("rar", args);

      rarProcess.stderr.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      rarProcess.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          void this.notifyRarNotInstalled()
            .catch((notifyError) => {
              this.logger.error(
                "Failed to send RAR-not-installed notification to Telegram",
                notifyError instanceof Error
                  ? notifyError.stack
                  : String(notifyError),
              );
            })
            .finally(() => {
              reject(
                new InternalServerErrorException(
                  EXCEPTION_CONSTANT.BACKUP_RAR_NOT_INSTALLED,
                ),
              );
            });
          return;
        }

        reject(error);
      });

      rarProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
        reject(new Error(stderr || `rar exited with code ${String(code)}`));
      });
    });
  }

  private async listRarArchiveParts(archivePath: string): Promise<string[]> {
    const archiveDir = dirname(archivePath);
    const archiveFileName = basename(archivePath);
    const setPrefix = this.getRarArchiveSetPrefix(archiveFileName);
    const partPattern = new RegExp(
      `^${this.escapeRegExp(setPrefix)}\\.(?:rar|r\\d{2})$`,
    );
    const entries = await readdir(archiveDir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && partPattern.test(entry.name))
      .map((entry) => join(archiveDir, entry.name))
      .sort((left, right) =>
        this.compareRarPartPaths(basename(left), basename(right)),
      );
  }

  private getRarArchiveSetPrefix(archiveFileName: string): string {
    if (!archiveFileName.endsWith(".rar")) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    }

    return archiveFileName.slice(0, -".rar".length);
  }

  private compareRarPartPaths(left: string, right: string): number {
    return this.getRarPartOrder(left) - this.getRarPartOrder(right);
  }

  private getRarPartOrder(fileName: string): number {
    if (fileName.endsWith(".rar")) {
      return -1;
    }

    const match = fileName.match(/\.r(\d{2})$/);
    return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private async sumFileSizes(filePaths: string[]): Promise<number> {
    const sizes = await Promise.all(
      filePaths.map(async (filePath) => (await stat(filePath)).size),
    );

    return sizes.reduce((total, size) => total + size, 0);
  }

  private async findOversizedTelegramParts(
    archiveParts: string[],
  ): Promise<string[]> {
    const oversizedParts: string[] = [];

    for (const partPath of archiveParts) {
      const partSize = (await stat(partPath)).size;
      if (partSize > BACKUP_CONSTANT.TELEGRAM_MAX_DOCUMENT_BYTES) {
        oversizedParts.push(partPath);
      }
    }

    return oversizedParts;
  }

  private assertRarArchive(
    archiveFileName: string,
    archivePath: string,
  ): void {
    if (!archiveFileName.endsWith(`.${BACKUP_ARCHIVE_FORMAT}`)) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    }

    if (!archivePath.endsWith(`.${BACKUP_ARCHIVE_FORMAT}`)) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.BACKUP_CREATE_FAILED,
      );
    }
  }
}
