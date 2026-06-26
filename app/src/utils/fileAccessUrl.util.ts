import { resolveApiBaseUrl } from "./apiBaseUrl.util";

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
  readonly fileId?: string;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

function getFallbackOrigin(): string {
  return resolveApiBaseUrl();
}

export function resolveFileAccessUrl(
  access: FileAccessUrl | null | undefined,
  fallbackOrigin?: string
): string | null {
  const fileId = access?.fileId?.trim();
  const token = access?.token?.trim();
  if (!fileId || !token || !access) {
    return null;
  }

  const base = (access.baseUrl?.trim() || fallbackOrigin || getFallbackOrigin()).replace(/\/$/, "");
  const apiPath = access.apiPath.startsWith("/") ? access.apiPath : `/${access.apiPath}`;

  return `${base}${apiPath}/${fileId}/content?token=${encodeURIComponent(token)}`;
}

export function getFileIdFromAccessUrl(access: FileAccessUrl | null | undefined): string | null {
  const rawFileId = access?.fileId;
  if (rawFileId == null) {
    return null;
  }

  const fileId = typeof rawFileId === "string" ? rawFileId.trim() : String(rawFileId).trim();
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

const PDF_EXTENSIONS = new Set(["pdf"]);

const TEXT_EXTENSIONS = new Set(["txt", "text"]);

const EXECUTABLE_EXTENSIONS = new Set([
  "exe",
  "msi",
  "msp",
  "com",
  "bat",
  "cmd",
  "scr",
  "pif",
  "ps1",
  "vbs",
  "vbe",
  "hta",
  "cpl",
  "msc",
  "inf",
  "reg",
  "lnk",
  "dll",
  "sys",
  "drv",
  "app",
  "dmg",
  "pkg",
  "command",
  "workflow",
  "sh",
  "bash",
  "zsh",
  "fish",
  "run",
  "bin",
  "deb",
  "rpm",
  "apk",
  "appimage",
  "jar",
  "jnlp",
  "msix",
  "appx",
  "ipa",
  "xap",
]);

const EXECUTABLE_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/x-bat",
  "application/vnd.microsoft.portable-executable",
  "application/x-mach-binary",
  "application/java-archive",
  "application/vnd.android.package-archive",
  "application/x-apple-diskimage",
  "application/x-debian-package",
  "application/x-redhat-package-manager",
  "application/vnd.ms-cab-compressed",
  "application/x-ms-installer",
  "application/x-msi",
  "application/vnd.apple.installer+xml",
]);

export function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return "";
  }

  return trimmed.slice(dotIndex + 1).toLowerCase();
}

export function isExecutableFileType(mimeType: string, fileName: string): boolean {
  const normalizedMime = mimeType.trim().toLowerCase();
  if (EXECUTABLE_MIME_TYPES.has(normalizedMime)) {
    return true;
  }

  if (
    normalizedMime === "application/octet-stream" &&
    EXECUTABLE_EXTENSIONS.has(getFileExtension(fileName))
  ) {
    return true;
  }

  return EXECUTABLE_EXTENSIONS.has(getFileExtension(fileName));
}

export function isViewableFileType(mimeType: string, fileName: string): boolean {
  if (isExecutableFileType(mimeType, fileName)) {
    return false;
  }

  const normalizedMime = mimeType.trim().toLowerCase();
  if (
    normalizedMime.startsWith("image/") ||
    normalizedMime.startsWith("video/") ||
    normalizedMime.startsWith("audio/") ||
    normalizedMime === "application/pdf" ||
    normalizedMime.startsWith("text/")
  ) {
    return true;
  }

  const extension = getFileExtension(fileName);
  return (
    IMAGE_EXTENSIONS.has(extension) ||
    VIDEO_EXTENSIONS.has(extension) ||
    VOICE_EXTENSIONS.has(extension) ||
    PDF_EXTENSIONS.has(extension) ||
    TEXT_EXTENSIONS.has(extension)
  );
}

export function getViewableMediaKind(
  mimeType: string,
  fileName: string
): "image" | "video" | "audio" | "pdf" | "text" | null {
  if (isExecutableFileType(mimeType, fileName)) {
    return null;
  }

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
  if (normalizedMime === "application/pdf") {
    return "pdf";
  }
  if (normalizedMime.startsWith("text/")) {
    return "text";
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
  if (PDF_EXTENSIONS.has(extension)) {
    return "pdf";
  }
  if (TEXT_EXTENSIONS.has(extension)) {
    return "text";
  }

  return null;
}

/** Chrome/Adobe PDF embed fragment — hides built-in toolbar and fits page to viewer. */
export function buildPdfEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  const fragment = "toolbar=0&navpanes=0&statusbar=0&messages=0&scrollbar=1&view=Fit";
  if (trimmed.includes("#")) {
    return `${trimmed}&${fragment}`;
  }

  return `${trimmed}#${fragment}`;
}

export function buildExistingFilePreview(
  accessUrl: FileAccessUrl | null | undefined,
  fallbackName?: string,
  overrides?: {
    readonly mimeType?: string | null;
    readonly sizeBytes?: number | null;
  }
): ExistingFilePreview | null {
  const resolved = resolveFileAccessUrl(accessUrl);
  if (!resolved) {
    return null;
  }

  const name = accessUrl?.name?.trim() || fallbackName?.trim() || "فایل";
  const mimeType =
    overrides?.mimeType?.trim() || accessUrl?.mimeType?.trim() || "application/octet-stream";
  if (isExecutableFileType(mimeType, name)) {
    return null;
  }

  const fileId = getFileIdFromAccessUrl(accessUrl) ?? undefined;

  return {
    accessUrl: resolved,
    fileId,
    name,
    mimeType,
    sizeBytes: overrides?.sizeBytes ?? accessUrl?.sizeBytes ?? 0,
  };
}
