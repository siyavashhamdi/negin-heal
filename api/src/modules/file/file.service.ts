import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { extname } from "path";
import { Readable } from "stream";
import { Client as MinioClient } from "minio";
import { Model, Types } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";

import { SecurityConfig } from "../../config/security.config";
import { env } from "../../config";
import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";
import { formatInfrastructureConnectionError } from "../../utils/infrastructure-connection-error.util";
import { StoredFile, StoredFileDocument } from "../../database/schemas";
import { addNotDeletedCondition } from "../../database/utils/not-deleted-query.util";
import {
  createFileAccessUrlDescriptor,
  FileAccessUrlDescriptor,
} from "./file-access-url.util";
import { FileUploadGqlResponse } from "./graphql/responses";
import {
  FILE_UPLOAD_POLICIES,
  type FileUploadPolicyRule,
} from "./file-upload-policy.constants";
import { assertFileAllowedByPolicy } from "./file-upload-policy.util";
import { isExecutableFileType } from "./executable-file-type.util";
import { ImageCompressionService } from "./image-compression.service";

export type { FileAccessUrlDescriptor } from "./file-access-url.util";

export type StoredFileAccessSummary = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  accessUrl: FileAccessUrlDescriptor;
};

export type StoredFileUploadResult = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
  uploadedAt: Date;
  accessUrl: FileAccessUrlDescriptor;
};

type StoredFileStorageRecord = {
  bucket?: string;
  objectKey?: string;
  path?: string;
};

type StoredFileStorageLocation = {
  bucket: string;
  objectKey: string;
};

@Injectable()
export class FileService implements OnModuleInit {
  static readonly FILE_ACCESS_URL_TTL_SECONDS = 60 * 60;

  private readonly logger = new Logger(FileService.name);
  private readonly minioClient: MinioClient;

  constructor(
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    private readonly imageCompressionService: ImageCompressionService,
  ) {
    this.minioClient = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.verifyMinioConnectivity();
  }

  async uploadFromStream(params: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    stream: Readable;
    uploadPolicy?: FileUploadPolicyRule;
  }): Promise<StoredFileUploadResult> {
    if (!params.name.trim()) {
      throw new BadRequestException(EXCEPTION_CONSTANT.FILE_NAME_REQUIRED);
    }

    if (params.sizeBytes < 0) {
      throw new BadRequestException(EXCEPTION_CONSTANT.FILE_SIZE_INVALID);
    }

    if (isExecutableFileType(params.mimeType, params.name)) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.EXECUTABLE_FILE_NOT_ALLOWED,
      );
    }

    const uploadPolicy = params.uploadPolicy ?? FILE_UPLOAD_POLICIES.ANY;

    assertFileAllowedByPolicy({
      mimeType: params.mimeType,
      fileName: params.name,
      sizeBytes: params.sizeBytes,
      policy: uploadPolicy,
    });

    await this.ensureBucket();

    const uploadedAt = new Date();
    const bucket = env.MINIO_BUCKET;
    const objectKey = this.buildObjectName(params.name, uploadedAt);
    const uploadPayload = await this.prepareUploadPayload({
      ...params,
      uploadPolicy,
    });

    await this.minioClient.putObject(
      bucket,
      objectKey,
      uploadPayload.body,
      uploadPayload.sizeBytes,
      {
        "Content-Type": uploadPayload.mimeType,
        "X-Amz-Meta-Original-Name": encodeURIComponent(params.name),
      },
    );

    const storedFile = await this.storedFileModel.create({
      name: params.name,
      mimeType: uploadPayload.mimeType,
      sizeBytes: uploadPayload.sizeBytes,
      path: `${bucket}/${objectKey}`,
      bucket,
      objectKey,
      uploadedAt,
    });

    return this.toUploadResult(storedFile);
  }

  createAccessUrlDescriptor(
    fileId: string | Types.ObjectId,
    name?: string,
    mimeType?: string,
    sizeBytes?: number,
  ): FileAccessUrlDescriptor {
    return createFileAccessUrlDescriptor(
      fileId,
      this.createAccessToken(fileId.toString()),
      name,
      mimeType,
      sizeBytes,
    );
  }

  async getAccessUrlMap(
    fileIds: Array<string | Types.ObjectId | null | undefined>,
  ): Promise<Map<string, FileAccessUrlDescriptor>> {
    const uniqueIds = this.normalizeFileIds(fileIds);
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const files = await this.storedFileModel
      .find({ _id: { $in: uniqueIds } })
      .exec();

    return new Map(
      files.map((file) => [
        file._id.toString(),
        this.createAccessUrlDescriptor(
          file._id,
          file.name,
          file.mimeType,
          file.sizeBytes,
        ),
      ]),
    );
  }

  async getFileSummariesByIds(
    fileIds: Array<string | Types.ObjectId | null | undefined>,
  ): Promise<Map<string, StoredFileAccessSummary>> {
    const uniqueIds = this.normalizeFileIds(fileIds);
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const files = await this.storedFileModel
      .find({ _id: { $in: uniqueIds } })
      .exec();

    return new Map(
      files.map((file) => [
        file._id.toString(),
        {
          name: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          path: file.path,
          accessUrl: this.createAccessUrlDescriptor(
            file._id,
            file.name,
            file.mimeType,
            file.sizeBytes,
          ),
        },
      ]),
    );
  }

  async findById(id: string): Promise<FileUploadGqlResponse> {
    const storedFile = await this.storedFileModel.findById(id).exec();
    if (!storedFile) {
      throw new NotFoundException(EXCEPTION_CONSTANT.FILE_NOT_FOUND);
    }

    return this.toUploadGqlResponse(storedFile);
  }

  toUploadGqlResponse(storedFile: StoredFileDocument): FileUploadGqlResponse {
    return this.toUploadResult(storedFile);
  }

  async downloadBufferById(id: string): Promise<{
    storedFile: StoredFileDocument;
    buffer: Buffer;
  }> {
    const { storedFile, stream } = await this.getDownloadStreamById(id);
    const buffer = await this.readStreamToBuffer(
      stream,
      SecurityConfig.getMaxRequestSize(),
    );

    return { storedFile, buffer };
  }

  async uploadFromBuffer(params: {
    name: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<FileUploadGqlResponse> {
    return this.uploadFromStream({
      name: params.name,
      mimeType: params.mimeType,
      sizeBytes: params.buffer.length,
      stream: Readable.from(params.buffer),
      uploadPolicy: FILE_UPLOAD_POLICIES.ANY,
    });
  }

  async getDownloadStreamById(id: string): Promise<{
    storedFile: StoredFileDocument;
    stream: Readable;
  }> {
    const storedFile = await this.storedFileModel.findById(id).exec();
    if (!storedFile) {
      throw new NotFoundException(EXCEPTION_CONSTANT.FILE_NOT_FOUND);
    }

    const { bucket, objectKey } = this.resolveStorageLocation(storedFile);
    const stream = await this.minioClient.getObject(bucket, objectKey);

    return { storedFile, stream };
  }

  verifyAccessToken(fileId: string, token: string): boolean {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf8");
      const separatorIndex = decoded.lastIndexOf(":");
      if (separatorIndex <= 0) {
        return false;
      }

      const payload = decoded.slice(0, separatorIndex);
      const signature = decoded.slice(separatorIndex + 1);
      const [id, expiresAtValue] = payload.split(":");
      if (!id || !expiresAtValue || id !== fileId) {
        return false;
      }

      const expiresAt = Number.parseInt(expiresAtValue, 10);
      if (
        !Number.isFinite(expiresAt) ||
        Math.floor(Date.now() / 1000) > expiresAt
      ) {
        return false;
      }

      const expectedSignature = this.signPayload(payload);
      const signatureBuffer = Buffer.from(signature, "utf8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  async deleteByIds(
    ids: Types.ObjectId[],
    options?: { isSystemOrphanCleanup?: boolean },
  ): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const storedFiles = await this.storedFileModel.collection
      .find(
        addNotDeletedCondition({
          _id: { $in: ids },
        }),
        { projection: { bucket: 1, objectKey: 1, path: 1 } },
      )
      .toArray();

    if (storedFiles.length === 0) {
      return 0;
    }

    const activeFileIds = storedFiles.map(
      (storedFile) => storedFile._id as Types.ObjectId,
    );

    for (const storedFile of storedFiles) {
      const location = this.resolveStorageLocationSafely(
        storedFile as StoredFileStorageRecord,
      );
      if (!location) {
        this.logger.warn(
          `Skipping MinIO delete for stored file ${String(storedFile._id)}: invalid storage location`,
        );
        continue;
      }

      await this.removeMinioObjectSafely(location.bucket, location.objectKey);
    }

    if (options?.isSystemOrphanCleanup) {
      return this.softDeleteStoredFileRecordsAsSystemOrphans(activeFileIds);
    }

    return this.softDeleteStoredFileRecordsByIds(activeFileIds);
  }

  async deleteUnreferencedByIds(
    ids: Types.ObjectId[],
    referencedFileIds: Set<string>,
  ): Promise<number> {
    const unreferencedIds = this.excludeReferencedFileIds(
      ids,
      referencedFileIds,
    );
    if (unreferencedIds.length === 0) {
      return 0;
    }

    return this.deleteByIds(unreferencedIds, { isSystemOrphanCleanup: true });
  }

  async findReferencedFileIdsUnavailableForUse(
    referencedFileIds: Set<string>,
  ): Promise<Set<string>> {
    const unavailableFileIds = new Set<string>();
    if (referencedFileIds.size === 0) {
      return unavailableFileIds;
    }

    const referencedObjectIds = [...referencedFileIds].map(
      (fileId) => new Types.ObjectId(fileId),
    );
    const activeStoredFiles = await this.storedFileModel.collection
      .find(
        addNotDeletedCondition({
          _id: { $in: referencedObjectIds },
        }),
        { projection: { bucket: 1, objectKey: 1, path: 1 } },
      )
      .toArray();

    const activeStoredFileById = new Map(
      activeStoredFiles.map((storedFile) => [
        (storedFile._id as Types.ObjectId).toString(),
        storedFile as StoredFileStorageRecord & { _id: Types.ObjectId },
      ]),
    );

    for (const fileId of referencedFileIds) {
      const storedFile = activeStoredFileById.get(fileId);
      if (!storedFile) {
        unavailableFileIds.add(fileId);
        continue;
      }

      const location = this.resolveStorageLocationSafely(storedFile);
      if (!location) {
        unavailableFileIds.add(fileId);
        continue;
      }

      const existsInMinio = await this.minioObjectExistsSafely(
        location.bucket,
        location.objectKey,
      );
      if (!existsInMinio) {
        unavailableFileIds.add(fileId);
      }
    }

    return unavailableFileIds;
  }

  async removeMinioObjectsWithoutDbRecord(params: {
    referencedFileIds: Set<string>;
  }): Promise<number> {
    await this.ensureBucket();

    const bucket = env.MINIO_BUCKET;
    const knownObjectKeys = await this.collectKnownMinioObjectKeys();
    const minioObjectKeys = await this.listMinioObjectKeys(bucket);
    const orphanObjectKeys = minioObjectKeys.filter(
      (objectKey) =>
        !knownObjectKeys.has(this.buildMinioObjectLookupKey(bucket, objectKey)),
    );

    let removedCount = 0;

    for (const objectKey of orphanObjectKeys) {
      const storedFileRecord =
        await this.findActiveStoredFileRecordByStorageLocation(
          bucket,
          objectKey,
        );

      if (storedFileRecord?._id) {
        continue;
      }

      const isReferenced = await this.isMinioObjectReferencedByStoredFiles(
        bucket,
        objectKey,
        params.referencedFileIds,
      );
      if (isReferenced) {
        this.logger.warn(
          `Skipping MinIO orphan candidate ${bucket}/${objectKey}: object belongs to a referenced stored file`,
        );
        continue;
      }

      await this.removeMinioObjectSafely(bucket, objectKey);
      removedCount++;
    }

    return removedCount;
  }

  async removeUnreferencedStoredFileRecordsMissingInMinio(params: {
    getReferencedFileIds: () => Promise<Set<string>>;
    scanBatchSize: number;
    deleteBatchSize: number;
  }): Promise<number> {
    let deletedCount = 0;
    let lastId: Types.ObjectId | undefined;

    while (true) {
      const referencedFileIds = await params.getReferencedFileIds();

      const batch = await this.storedFileModel.collection
        .find(addNotDeletedCondition(lastId ? { _id: { $gt: lastId } } : {}), {
          projection: { _id: 1, bucket: 1, objectKey: 1, path: 1 },
        })
        .sort({ _id: 1 })
        .limit(params.scanBatchSize)
        .toArray();

      if (batch.length === 0) {
        break;
      }

      const missingInMinioIds: Types.ObjectId[] = [];

      for (const storedFile of batch) {
        const fileId = storedFile._id as Types.ObjectId;

        if (referencedFileIds.has(fileId.toString())) {
          continue;
        }

        const location = this.resolveStorageLocationSafely(
          storedFile as StoredFileStorageRecord,
        );
        if (!location) {
          this.logger.warn(
            `Removing stored file ${fileId.toString()} from DB: invalid storage location`,
          );
          missingInMinioIds.push(fileId);
          continue;
        }

        const existsInMinio = await this.minioObjectExistsSafely(
          location.bucket,
          location.objectKey,
        );
        if (!existsInMinio) {
          missingInMinioIds.push(fileId);
        }
      }

      for (
        let index = 0;
        index < missingInMinioIds.length;
        index += params.deleteBatchSize
      ) {
        const deleteBatch = missingInMinioIds.slice(
          index,
          index + params.deleteBatchSize,
        );
        deletedCount += await this.softDeleteUnreferencedOrphansByIds(
          deleteBatch,
          referencedFileIds,
        );
      }

      lastId = batch[batch.length - 1]._id as Types.ObjectId;

      if (batch.length < params.scanBatchSize) {
        break;
      }
    }

    return deletedCount;
  }

  private async softDeleteUnreferencedOrphansByIds(
    ids: Types.ObjectId[],
    referencedFileIds: Set<string>,
  ): Promise<number> {
    const unreferencedIds = this.excludeReferencedFileIds(
      ids,
      referencedFileIds,
    );
    if (unreferencedIds.length === 0) {
      return 0;
    }

    return this.softDeleteStoredFileRecordsAsSystemOrphans(unreferencedIds);
  }

  private async softDeleteStoredFileRecordsByIds(
    ids: Types.ObjectId[],
  ): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const result = await this.storedFileModel.deleteMany({
      _id: { $in: ids },
    });

    return result.deletedCount ?? 0;
  }

  private async softDeleteStoredFileRecordsAsSystemOrphans(
    ids: Types.ObjectId[],
  ): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const result = await this.storedFileModel.collection.updateMany(
      addNotDeletedCondition({
        _id: { $in: ids },
      }),
      {
        $set: {
          "audit.deletedAt": new Date(),
          isSystemOrphanCleanup: true,
        },
        $unset: {
          "audit.deletedBy": "",
        },
      },
    );

    return result.modifiedCount ?? 0;
  }

  private excludeReferencedFileIds(
    ids: Types.ObjectId[],
    referencedFileIds: Set<string>,
  ): Types.ObjectId[] {
    if (referencedFileIds.size === 0) {
      return ids;
    }

    const unreferencedIds = ids.filter(
      (fileId) => !referencedFileIds.has(fileId.toString()),
    );

    const skippedCount = ids.length - unreferencedIds.length;
    if (skippedCount > 0) {
      this.logger.warn(
        `Skipped deleting ${skippedCount} referenced stored file(s)`,
      );
    }

    return unreferencedIds;
  }

  private async isMinioObjectReferencedByStoredFiles(
    bucket: string,
    objectKey: string,
    referencedFileIds: Set<string>,
  ): Promise<boolean> {
    if (referencedFileIds.size === 0) {
      return false;
    }

    const referencedObjectIds = [...referencedFileIds].map(
      (fileId) => new Types.ObjectId(fileId),
    );
    const referencedStoredFile = await this.storedFileModel.collection.findOne(
      addNotDeletedCondition({
        _id: { $in: referencedObjectIds },
        $or: [{ bucket, objectKey }, { path: `${bucket}/${objectKey}` }],
      }),
      { projection: { _id: 1 } },
    );

    return Boolean(referencedStoredFile?._id);
  }

  private async removeMinioObjectSafely(
    bucket: string,
    objectKey: string,
  ): Promise<void> {
    try {
      await this.minioClient.removeObject(bucket, objectKey);
    } catch (error) {
      if (this.isMinioObjectNotFoundError(error)) {
        return;
      }

      this.logger.warn(
        `Failed to remove MinIO object ${bucket}/${objectKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async collectKnownMinioObjectKeys(): Promise<Set<string>> {
    const storedFiles = await this.storedFileModel.collection
      .find(addNotDeletedCondition({}), {
        projection: { bucket: 1, objectKey: 1, path: 1 },
      })
      .toArray();

    const knownObjectKeys = new Set<string>();
    for (const storedFile of storedFiles) {
      const location = this.resolveStorageLocationSafely(
        storedFile as StoredFileStorageRecord,
      );
      if (!location) {
        this.logger.warn(
          `Skipping known MinIO key mapping for stored file ${String(storedFile._id)}: invalid storage location`,
        );
        continue;
      }

      knownObjectKeys.add(
        this.buildMinioObjectLookupKey(location.bucket, location.objectKey),
      );
    }

    return knownObjectKeys;
  }

  private buildMinioObjectLookupKey(bucket: string, objectKey: string): string {
    return `${bucket}/${objectKey}`;
  }

  private async minioObjectExistsSafely(
    bucket: string,
    objectKey: string,
  ): Promise<boolean> {
    try {
      return await this.minioObjectExists(bucket, objectKey);
    } catch (error) {
      this.logger.warn(
        `Unable to verify MinIO object ${bucket}/${objectKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return true;
    }
  }

  private async findActiveStoredFileRecordByStorageLocation(
    bucket: string,
    objectKey: string,
  ): Promise<{ _id: Types.ObjectId } | null> {
    const storedFileRecord = await this.storedFileModel.collection.findOne(
      addNotDeletedCondition({
        $or: [{ bucket, objectKey }, { path: `${bucket}/${objectKey}` }],
      }),
      { projection: { _id: 1 } },
    );

    return storedFileRecord?._id
      ? { _id: storedFileRecord._id as Types.ObjectId }
      : null;
  }

  private resolveStorageLocationSafely(
    storedFile: StoredFileStorageRecord,
  ): StoredFileStorageLocation | null {
    try {
      return this.resolveStorageLocationFromRecord(storedFile);
    } catch {
      return null;
    }
  }

  private async minioObjectExists(
    bucket: string,
    objectKey: string,
  ): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucket, objectKey);
      return true;
    } catch (error) {
      if (this.isMinioObjectNotFoundError(error)) {
        return false;
      }

      throw error;
    }
  }

  private isMinioObjectNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const minioError = error as { code?: string; statusCode?: number };
    return (
      minioError.code === "NotFound" ||
      minioError.code === "NoSuchKey" ||
      minioError.statusCode === 404
    );
  }

  private toUploadResult(
    storedFile: StoredFileDocument,
  ): StoredFileUploadResult {
    return {
      name: storedFile.name,
      mimeType: storedFile.mimeType,
      sizeBytes: storedFile.sizeBytes,
      path: storedFile.path,
      uploadedAt: storedFile.uploadedAt ?? new Date(),
      accessUrl: this.createAccessUrlDescriptor(
        storedFile._id,
        storedFile.name,
        storedFile.mimeType,
        storedFile.sizeBytes,
      ),
    };
  }

  private createAccessToken(fileId: string): string {
    const expiresAt =
      Math.floor(Date.now() / 1000) + FileService.FILE_ACCESS_URL_TTL_SECONDS;
    const payload = `${fileId}:${expiresAt}`;
    const signature = this.signPayload(payload);
    return Buffer.from(`${payload}:${signature}`).toString("base64url");
  }

  private signPayload(payload: string): string {
    return createHmac("sha256", env.JWT_SECRET ?? "")
      .update(payload)
      .digest("base64url");
  }

  private resolveStorageLocation(storedFile: StoredFileDocument): {
    bucket: string;
    objectKey: string;
  } {
    return this.resolveStorageLocationFromRecord(storedFile);
  }

  private resolveStorageLocationFromRecord(
    storedFile: StoredFileStorageRecord,
  ): StoredFileStorageLocation {
    if (storedFile.bucket && storedFile.objectKey) {
      return {
        bucket: storedFile.bucket,
        objectKey: storedFile.objectKey,
      };
    }

    const slashIndex = storedFile.path?.indexOf("/") ?? -1;
    if (slashIndex <= 0 || !storedFile.path) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.FILE_PATH_INVALID,
      );
    }

    return {
      bucket: storedFile.path.slice(0, slashIndex),
      objectKey: storedFile.path.slice(slashIndex + 1),
    };
  }

  private async listMinioObjectKeys(bucket: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const objectKeys: string[] = [];
      const stream = this.minioClient.listObjectsV2(bucket, "", true);

      stream.on("data", (object) => {
        if (object.name) {
          objectKeys.push(object.name);
        }
      });
      stream.on("error", reject);
      stream.on("end", () => resolve(objectKeys));
    });
  }

  private async prepareUploadPayload(params: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    stream: Readable;
    uploadPolicy: FileUploadPolicyRule;
  }): Promise<{
    body: Buffer | Readable;
    mimeType: string;
    sizeBytes: number;
  }> {
    if (
      !this.imageCompressionService.shouldCompress(
        params.mimeType,
        params.name,
        params.sizeBytes,
      )
    ) {
      return {
        body: params.stream,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
      };
    }

    const maxSizeBytes = Math.min(
      SecurityConfig.getMaxRequestSize(),
      params.uploadPolicy.maxSizeBytes,
    );
    const inputBuffer = await this.readStreamToBuffer(
      params.stream,
      maxSizeBytes,
    );

    assertFileAllowedByPolicy({
      mimeType: params.mimeType,
      fileName: params.name,
      sizeBytes: inputBuffer.length,
      policy: params.uploadPolicy,
    });
    const compressionResult = await this.imageCompressionService.compress(
      inputBuffer,
      params.mimeType,
      params.name,
    );

    return {
      body: compressionResult.buffer,
      mimeType: compressionResult.mimeType,
      sizeBytes: compressionResult.buffer.length,
    };
  }

  private async readStreamToBuffer(
    stream: Readable,
    maxSizeBytes: number,
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let totalLength = 0;

    for await (const chunk of stream) {
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalLength += bufferChunk.length;

      if (totalLength > maxSizeBytes) {
        throw new BadRequestException(EXCEPTION_CONSTANT.FILE_SIZE_EXCEEDED);
      }

      chunks.push(bufferChunk);
    }

    return Buffer.concat(chunks, totalLength);
  }

  private async verifyMinioConnectivity(): Promise<void> {
    try {
      await this.minioClient.listBuckets();
      await this.ensureBucket();
    } catch (error) {
      const message = formatInfrastructureConnectionError("minio", error);
      this.logger.error(message);
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(env.MINIO_BUCKET);
      if (!exists) {
        await this.minioClient.makeBucket(env.MINIO_BUCKET);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        EXCEPTION_CONSTANT.FILE_UPLOAD_BUCKET_ERROR,
      );
    }
  }

  private buildObjectName(
    fileName: string,
    uploadedAt: Date = new Date(),
  ): string {
    const extension = extname(fileName);
    const year = uploadedAt.getUTCFullYear();
    const month = String(uploadedAt.getUTCMonth() + 1).padStart(2, "0");
    const day = String(uploadedAt.getUTCDate()).padStart(2, "0");
    return `${year}/${month}/${day}/${randomUUID()}${extension}`;
  }

  private normalizeFileIds(
    fileIds: Array<string | Types.ObjectId | null | undefined>,
  ): Types.ObjectId[] {
    return [
      ...new Set(
        fileIds
          .map((id) => id?.toString?.() ?? "")
          .filter((id) => id.length > 0 && Types.ObjectId.isValid(id)),
      ),
    ].map((id) => new Types.ObjectId(id));
  }
}
