import { randomUUID } from "crypto";
import { extname } from "path";
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
import { FileUploadGqlInput } from "./graphql/inputs";
import { FileUploadGqlResponse } from "./graphql/responses";

const FILE_ACCESS_URL_TTL_SECONDS = 60 * 60;

@Injectable()
export class FileService {
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

  async upload(input: FileUploadGqlInput): Promise<FileUploadGqlResponse> {
    const fileBuffer = this.decodeBase64(input.contentBase64);
    if (fileBuffer.length !== input.sizeBytes) {
      throw new BadRequestException(
        "File size does not match uploaded content",
      );
    }

    await this.ensureBucket();

    const bucket = env.MINIO_BUCKET;
    const objectKey = this.buildObjectName(input.name);
    await this.minioClient.putObject(
      bucket,
      objectKey,
      fileBuffer,
      fileBuffer.length,
      {
        "Content-Type": input.mimeType,
        "X-Amz-Meta-Original-Name": encodeURIComponent(input.name),
      },
    );

    const uploadedAt = new Date();
    const storedFile = await this.storedFileModel.create({
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      path: `${bucket}/${objectKey}`,
      bucket,
      objectKey,
      uploadedAt,
    });

    return {
      id: storedFile._id,
      name: storedFile.name,
      mimeType: storedFile.mimeType,
      sizeBytes: storedFile.sizeBytes,
      path: storedFile.path,
      uploadedAt: storedFile.uploadedAt,
    };
  }

  async findById(id: string): Promise<FileUploadGqlResponse> {
    const storedFile = await this.storedFileModel.findById(id).exec();
    if (!storedFile) {
      throw new NotFoundException("File not found");
    }

    return {
      id: storedFile._id,
      name: storedFile.name,
      mimeType: storedFile.mimeType,
      sizeBytes: storedFile.sizeBytes,
      path: storedFile.path,
      uploadedAt: storedFile.uploadedAt,
      accessUrl: await this.createAccessUrl(storedFile),
    };
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

  private async createAccessUrl(
    storedFile: StoredFileDocument,
  ): Promise<string> {
    const { bucket, objectKey } = this.resolveStorageLocation(storedFile);
    return this.minioClient.presignedGetObject(
      bucket,
      objectKey,
      FILE_ACCESS_URL_TTL_SECONDS,
    );
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

  private decodeBase64(contentBase64: string): Buffer {
    const normalized = contentBase64.replace(/^data:.*;base64,/, "");
    try {
      return Buffer.from(normalized, "base64");
    } catch {
      throw new BadRequestException("Invalid base64 file content");
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
        `Unable to prepare MinIO bucket: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  private buildObjectName(fileName: string): string {
    const extension = extname(fileName);
    return `dashboard/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
  }
}
