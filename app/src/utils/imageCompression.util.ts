import imageCompression, { type Options } from "browser-image-compression";
import browserImageCompressionLibUrl from "browser-image-compression/dist/browser-image-compression.js?url";

/** Longest edge cap — similar to Telegram photo uploads, with headroom for cover art. */
const MAX_IMAGE_DIMENSION_PX = 2048;

/** Target output size; the library iterates quality down until this is met when possible. */
const MAX_IMAGE_SIZE_MB = 1.25;

/** Starting JPEG/WebP quality before iterative reduction. */
const INITIAL_IMAGE_QUALITY = 0.85;

/** Skip re-encoding tiny images that are already efficiently compressed. */
const SKIP_BELOW_BYTES = 180 * 1024;

const SKIP_MIME_TYPES = new Set([
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const LOSSY_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/webp", "image/avif"]);

const COMPRESSIBLE_IMAGE_EXTENSION = /\.(jpe?g|png|webp|bmp|avif)$/i;

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function resolveMimeType(file: File): string {
  const normalizedType = normalizeMimeType(file.type);
  if (normalizedType) {
    return normalizedType;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
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

function isCompressibleImage(file: File): boolean {
  const mimeType = resolveMimeType(file);
  if (mimeType.startsWith("image/")) {
    return !SKIP_MIME_TYPES.has(mimeType);
  }

  return COMPRESSIBLE_IMAGE_EXTENSION.test(file.name);
}

function shouldSkipCompression(file: File): boolean {
  const mimeType = resolveMimeType(file);
  if (SKIP_MIME_TYPES.has(mimeType)) {
    return true;
  }

  if (file.size <= SKIP_BELOW_BYTES && LOSSY_IMAGE_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return false;
}

function buildCompressionOptions(mimeType: string): Options {
  const options: Options = {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_IMAGE_DIMENSION_PX,
    initialQuality: INITIAL_IMAGE_QUALITY,
    useWebWorker: true,
    libURL: browserImageCompressionLibUrl,
    preserveExif: false,
  };

  if (mimeType === "image/png") {
    options.fileType = "image/png";
  } else if (mimeType === "image/webp") {
    options.fileType = "image/webp";
  } else {
    options.fileType = "image/jpeg";
  }

  return options;
}

function withOriginalFileName(compressedFile: File, originalFile: File): File {
  if (compressedFile.name === originalFile.name) {
    return compressedFile;
  }

  return new File([compressedFile], originalFile.name, {
    type: compressedFile.type,
    lastModified: compressedFile.lastModified,
  });
}

/**
 * Compress raster images before upload (Telegram-style: resize + lossy encode).
 * GIF/SVG/icons and already-small JPEG/WebP files are left unchanged.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!isCompressibleImage(file) || shouldSkipCompression(file)) {
    return file;
  }

  const mimeType = resolveMimeType(file);

  try {
    const compressedFile = await imageCompression(file, buildCompressionOptions(mimeType));

    if (compressedFile.size >= file.size) {
      return file;
    }

    return withOriginalFileName(compressedFile, file);
  } catch {
    return file;
  }
}
