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
import { Request, Response } from "express";

import { SecurityConfig } from "../../../config/security.config";
import { RestAuthGuard } from "../../auth";
import { FileService } from "../file.service";

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
  ) {
    const maxSize = SecurityConfig.getMaxRequestSize();
    const sizeBytes = Number.parseInt(contentLengthHeader ?? "", 10);
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
      throw new BadRequestException("Content-Length header is required");
    }
    if (sizeBytes > maxSize) {
      throw new BadRequestException("File size exceeds the allowed limit");
    }

    const trimmedFileName = encodedFileName?.trim();
    if (!trimmedFileName) {
      throw new BadRequestException("X-File-Name header is required");
    }

    let name: string;
    try {
      name = decodeURIComponent(trimmedFileName);
    } catch {
      throw new BadRequestException("X-File-Name header is invalid");
    }

    if (!name.trim()) {
      throw new BadRequestException("File name is required");
    }

    const mimeType =
      contentType?.split(";")[0]?.trim() || "application/octet-stream";

    const uploadedFile = await this.fileService.uploadFromStream({
      name,
      mimeType,
      sizeBytes,
      stream: request,
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
      throw new UnauthorizedException("Invalid or expired file access token");
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
