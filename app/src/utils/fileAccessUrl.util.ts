export type FileAccessUrl = {
  readonly baseUrl?: string | null;
  readonly apiPath: string;
  readonly fileId: string;
  readonly token: string;
  readonly name?: string | null;
  readonly mimeType?: string | null;
  readonly sizeBytes?: number | null;
};

export type ExistingFilePreview = {
  readonly accessUrl: string;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

function getFallbackOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "";
}

export function resolveFileAccessUrl(
  access: FileAccessUrl | null | undefined,
  fallbackOrigin?: string,
): string | null {
  const fileId = access?.fileId?.trim();
  const token = access?.token?.trim();
  if (!fileId || !token || !access) {
    return null;
  }

  const base = (access.baseUrl?.trim() || fallbackOrigin || getFallbackOrigin()).replace(
    /\/$/,
    "",
  );
  const apiPath = access.apiPath.startsWith("/")
    ? access.apiPath
    : `/${access.apiPath}`;

  return `${base}${apiPath}/${fileId}/content?token=${encodeURIComponent(token)}`;
}

export function getFileIdFromAccessUrl(
  access: FileAccessUrl | null | undefined,
): string | null {
  const fileId = access?.fileId?.trim();
  return fileId || null;
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "avif",
  "heic",
  "heif",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);

const VOICE_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus", "oga"]);

export function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return "";
  }

  return trimmed.slice(dotIndex + 1).toLowerCase();
}

export function isViewableFileType(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.trim().toLowerCase();
  if (
    normalizedMime.startsWith("image/") ||
    normalizedMime.startsWith("video/") ||
    normalizedMime.startsWith("audio/")
  ) {
    return true;
  }

  const extension = getFileExtension(fileName);
  return (
    IMAGE_EXTENSIONS.has(extension) ||
    VIDEO_EXTENSIONS.has(extension) ||
    VOICE_EXTENSIONS.has(extension)
  );
}

export function getViewableMediaKind(
  mimeType: string,
  fileName: string,
): "image" | "video" | "audio" | null {
  const normalizedMime = mimeType.trim().toLowerCase();
  if (normalizedMime.startsWith("image/")) {
    return "image";
  }
  if (normalizedMime.startsWith("video/")) {
    return "video";
  }
  if (normalizedMime.startsWith("audio/")) {
    return "audio";
  }

  const extension = getFileExtension(fileName);
  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }
  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }
  if (VOICE_EXTENSIONS.has(extension)) {
    return "audio";
  }

  return null;
}

export function buildExistingFilePreview(
  accessUrl: FileAccessUrl | null | undefined,
  fallbackName?: string,
): ExistingFilePreview | null {
  const resolved = resolveFileAccessUrl(accessUrl);
  if (!resolved) {
    return null;
  }

  return {
    accessUrl: resolved,
    name: accessUrl?.name?.trim() || fallbackName?.trim() || "فایل",
    mimeType: accessUrl?.mimeType?.trim() || "application/octet-stream",
    sizeBytes: accessUrl?.sizeBytes ?? 0,
  };
}
