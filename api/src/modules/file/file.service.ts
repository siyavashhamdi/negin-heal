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
  NotFoundException,
} from "@nestjs/common";

import { env } from "../../config";
import { StoredFile, StoredFileDocument } from "../../database/schemas";
import {
  createFileAccessUrlDescriptor,
  FileAccessUrlDescriptor,
} from "./file-access-url.util";
import { FileUploadGqlResponse } from "./graphql/responses";

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

@Injectable()
export class FileService {
  static readonly FILE_ACCESS_URL_TTL_SECONDS = 60 * 60;

  private readonly minioClient: MinioClient;

  constructor(
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
  ) {
    this.minioClient = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  async uploadFromStream(params: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    stream: Readable;
  }): Promise<StoredFileUploadResult> {
    if (!params.name.trim()) {
      throw new BadRequestException("File name is required");
    }

    if (params.sizeBytes < 0) {
      throw new BadRequestException("File size must be zero or greater");
    }

    await this.ensureBucket();

    const uploadedAt = new Date();
    const bucket = env.MINIO_BUCKET;
    const objectKey = this.buildObjectName(params.name, uploadedAt);
    await this.minioClient.putObject(
      bucket,
      objectKey,
      params.stream,
      params.sizeBytes,
      {
        "Content-Type": params.mimeType,
        "X-Amz-Meta-Original-Name": encodeURIComponent(params.name),
      },
    );

    const storedFile = await this.storedFileModel.create({
      name: params.name,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      path: `${bucket}/${objectKey}`,
      bucket,
      objectKey,
      uploadedAt,
    });

    return this.toUploadResult(storedFile);
  }

  createAccessUrlDescriptor(
    fileId: string | Types.ObjectId,
  ): FileAccessUrlDescriptor {
    return createFileAccessUrlDescriptor(
      fileId,
      this.createAccessToken(fileId.toString()),
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
        this.createAccessUrlDescriptor(file._id),
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
          accessUrl: this.createAccessUrlDescriptor(file._id),
        },
      ]),
    );
  }

  async findById(id: string): Promise<FileUploadGqlResponse> {
    const storedFile = await this.storedFileModel.findById(id).exec();
    if (!storedFile) {
      throw new NotFoundException("File not found");
    }

    return this.toUploadResult(storedFile);
  }

  async getDownloadStreamById(id: string): Promise<{
    storedFile: StoredFileDocument;
    stream: Readable;
  }> {
    const storedFile = await this.storedFileModel.findById(id).exec();
    if (!storedFile) {
      throw new NotFoundException("File not found");
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

  async deleteByIds(ids: Types.ObjectId[]): Promise<void> {
    if (!ids.length) {
      return;
    }

    const storedFiles = await this.storedFileModel
      .find({ _id: { $in: ids } })
      .exec();

    for (const storedFile of storedFiles) {
      const { bucket, objectKey } = this.resolveStorageLocation(storedFile);
      await this.minioClient.removeObject(bucket, objectKey);
    }

    if (storedFiles.length > 0) {
      await this.storedFileModel.collection.deleteMany({
        _id: { $in: storedFiles.map((storedFile) => storedFile._id) },
      });
    }
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
      accessUrl: this.createAccessUrlDescriptor(storedFile._id),
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
    if (storedFile.bucket && storedFile.objectKey) {
      return {
        bucket: storedFile.bucket,
        objectKey: storedFile.objectKey,
      };
    }

    const slashIndex = storedFile.path.indexOf("/");
    if (slashIndex <= 0) {
      throw new InternalServerErrorException("Stored file path is invalid");
    }

    return {
      bucket: storedFile.path.slice(0, slashIndex),
      objectKey: storedFile.path.slice(slashIndex + 1),
    };
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(env.MINIO_BUCKET);
      if (!exists) {
        await this.minioClient.makeBucket(env.MINIO_BUCKET);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Unable to prepare MinIO bucket: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
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
