import { Injectable, Logger } from "@nestjs/common";
import sharp from "sharp";

import {
  COMPRESSIBLE_IMAGE_EXTENSION,
  INITIAL_IMAGE_QUALITY,
  LOSSY_IMAGE_MIME_TYPES,
  MAX_COMPRESSION_ITERATIONS,
  MAX_IMAGE_DIMENSION_PX,
  MAX_IMAGE_SIZE_BYTES,
  SKIP_BELOW_BYTES,
  SKIP_IMAGE_MIME_TYPES,
} from "./image-compression.constants";

export type ImageCompressionOutcome = {
  buffer: Buffer;
  mimeType: string;
  wasCompressed: boolean;
};

type OutputFormat = "jpeg" | "png" | "webp";
type SharpImage = ReturnType<typeof sharp>;

@Injectable()
export class ImageCompressionService {
  private readonly logger = new Logger(ImageCompressionService.name);

  shouldCompress(
    mimeType: string,
    fileName: string,
    sizeBytes: number,
  ): boolean {
    const resolvedMimeType = this.resolveMimeType(mimeType, fileName);
    if (!this.isCompressibleImage(resolvedMimeType, fileName)) {
      return false;
    }

    return !this.shouldSkipCompression(resolvedMimeType, sizeBytes);
  }

  async compress(
    input: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<ImageCompressionOutcome> {
    const resolvedMimeType = this.resolveMimeType(mimeType, fileName);
    const fallbackMimeType =
      resolvedMimeType || mimeType || "application/octet-stream";

    if (
      !this.isCompressibleImage(resolvedMimeType, fileName) ||
      this.shouldSkipCompression(resolvedMimeType, input.length)
    ) {
      return {
        buffer: input,
        mimeType: fallbackMimeType,
        wasCompressed: false,
      };
    }

    try {
      const image = sharp(input, { failOn: "none" }).rotate();
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        return {
          buffer: input,
          mimeType: fallbackMimeType,
          wasCompressed: false,
        };
      }

      const maxEdge = Math.max(metadata.width, metadata.height);
      if (
        input.length <= MAX_IMAGE_SIZE_BYTES &&
        maxEdge <= MAX_IMAGE_DIMENSION_PX &&
        LOSSY_IMAGE_MIME_TYPES.has(resolvedMimeType)
      ) {
        return {
          buffer: input,
          mimeType: fallbackMimeType,
          wasCompressed: false,
        };
      }

      const outputFormat = this.resolveOutputFormat(resolvedMimeType);
      const resized = image.resize({
        width: MAX_IMAGE_DIMENSION_PX,
        height: MAX_IMAGE_DIMENSION_PX,
        fit: "inside",
        withoutEnlargement: true,
      });

      let output = await this.encodeImage(
        resized,
        outputFormat,
        INITIAL_IMAGE_QUALITY,
      );

      if (output.length > MAX_IMAGE_SIZE_BYTES) {
        output = await this.compressToTargetSize(resized, outputFormat, output);
      }

      if (output.length >= input.length) {
        return {
          buffer: input,
          mimeType: fallbackMimeType,
          wasCompressed: false,
        };
      }

      return {
        buffer: output,
        mimeType: this.mimeTypeForFormat(outputFormat),
        wasCompressed: true,
      };
    } catch (error) {
      this.logger.warn(
        `Image compression failed for ${fileName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      return {
        buffer: input,
        mimeType: fallbackMimeType,
        wasCompressed: false,
      };
    }
  }

  private normalizeMimeType(mimeType: string): string {
    return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  }

  private resolveMimeType(mimeType: string, fileName: string): string {
    const normalizedType = this.normalizeMimeType(mimeType);
    if (normalizedType) {
      return normalizedType;
    }

    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "bmp":
        return "image/bmp";
      case "avif":
        return "image/avif";
      case "gif":
        return "image/gif";
      case "svg":
        return "image/svg+xml";
      default:
        return "";
    }
  }

  private isCompressibleImage(mimeType: string, fileName: string): boolean {
    if (mimeType.startsWith("image/")) {
      return !SKIP_IMAGE_MIME_TYPES.has(mimeType);
    }

    return COMPRESSIBLE_IMAGE_EXTENSION.test(fileName);
  }

  private shouldSkipCompression(mimeType: string, sizeBytes: number): boolean {
    if (SKIP_IMAGE_MIME_TYPES.has(mimeType)) {
      return true;
    }

    return (
      sizeBytes <= SKIP_BELOW_BYTES && LOSSY_IMAGE_MIME_TYPES.has(mimeType)
    );
  }

  private resolveOutputFormat(resolvedMimeType: string): OutputFormat {
    if (resolvedMimeType === "image/png") {
      return "png";
    }

    if (resolvedMimeType === "image/webp") {
      return "webp";
    }

    return "jpeg";
  }

  private mimeTypeForFormat(format: OutputFormat): string {
    switch (format) {
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      default:
        return "image/jpeg";
    }
  }

  private async encodeImage(
    image: SharpImage,
    format: OutputFormat,
    quality: number,
  ): Promise<Buffer> {
    switch (format) {
      case "png":
        return image
          .clone()
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
          })
          .toBuffer();
      case "webp":
        return image.clone().webp({ quality }).toBuffer();
      default:
        return image
          .clone()
          .jpeg({
            quality,
            mozjpeg: true,
          })
          .toBuffer();
    }
  }

  private async compressToTargetSize(
    image: SharpImage,
    format: OutputFormat,
    initialOutput: Buffer,
  ): Promise<Buffer> {
    let output = initialOutput;
    let quality = INITIAL_IMAGE_QUALITY;
    let pngMaxEdge = MAX_IMAGE_DIMENSION_PX;

    for (
      let iteration = 0;
      iteration < MAX_COMPRESSION_ITERATIONS &&
      output.length > MAX_IMAGE_SIZE_BYTES;
      iteration += 1
    ) {
      if (format === "png") {
        pngMaxEdge = Math.max(320, Math.floor(pngMaxEdge * 0.85));

        output = await image
          .clone()
          .resize({
            width: pngMaxEdge,
            height: pngMaxEdge,
            fit: "inside",
            withoutEnlargement: true,
          })
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
          })
          .toBuffer();
        continue;
      }

      quality = Math.max(40, quality - 5);
      output = await this.encodeImage(image, format, quality);
    }

    return output;
  }
}
