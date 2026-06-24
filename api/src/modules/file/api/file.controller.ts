import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { EXCEPTION_CONSTANT } from "../../../constants/exception.constant";
import { Request, Response } from "express";

import { SecurityConfig } from "../../../config/security.config";
import { RestAuthGuard } from "../../auth";
import { FileService } from "../file.service";
import {
  assertFileAllowedByPolicy,
  resolveFileUploadPolicy,
} from "../file-upload-policy.util";

@Controller("files")
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Put("upload")
  @UseGuards(RestAuthGuard)
  async upload(
    @Req() request: Request,
    @Headers("content-type") contentType?: string,
    @Headers("x-file-name") encodedFileName?: string,
    @Headers("content-length") contentLengthHeader?: string,
    @Headers("x-upload-policy") uploadPolicyHeader?: string,
  ) {
    const uploadPolicy = resolveFileUploadPolicy(uploadPolicyHeader);
    const globalMaxSize = SecurityConfig.getMaxRequestSize();
    const sizeBytes = Number.parseInt(contentLengthHeader ?? "", 10);
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
      throw new BadRequestException(EXCEPTION_CONSTANT.CONTENT_LENGTH_REQUIRED);
    }

    const trimmedFileName = encodedFileName?.trim();
    if (!trimmedFileName) {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.FILE_NAME_HEADER_REQUIRED,
      );
    }

    let name: string;
    try {
      name = decodeURIComponent(trimmedFileName);
    } catch {
      throw new BadRequestException(
        EXCEPTION_CONSTANT.FILE_NAME_HEADER_INVALID,
      );
    }

    if (!name.trim()) {
      throw new BadRequestException(EXCEPTION_CONSTANT.FILE_NAME_REQUIRED);
    }

    const mimeType =
      contentType?.split(";")[0]?.trim() || "application/octet-stream";

    assertFileAllowedByPolicy({
      mimeType,
      fileName: name,
      sizeBytes,
      policy: uploadPolicy,
    });

    if (sizeBytes > globalMaxSize) {
      throw new BadRequestException(EXCEPTION_CONSTANT.FILE_SIZE_EXCEEDED);
    }

    const uploadedFile = await this.fileService.uploadFromStream({
      name,
      mimeType,
      sizeBytes,
      stream: request,
      uploadPolicy,
    });

    return {
      ...uploadedFile,
      uploadedAt: uploadedFile.uploadedAt.toISOString(),
    };
  }

  @Get(":id/content")
  async getContent(
    @Param("id") id: string,
    @Query("token") token: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    if (!token || !this.fileService.verifyAccessToken(id, token)) {
      throw new UnauthorizedException(
        EXCEPTION_CONSTANT.FILE_ACCESS_TOKEN_INVALID,
      );
    }

    const { storedFile, stream } =
      await this.fileService.getDownloadStreamById(id);

    response.setHeader("Content-Type", storedFile.mimeType);
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(storedFile.name)}"`,
    );
    response.setHeader(
      "Cache-Control",
      `private, max-age=${FileService.FILE_ACCESS_URL_TTL_SECONDS}`,
    );
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    stream.pipe(response);
  }
}
