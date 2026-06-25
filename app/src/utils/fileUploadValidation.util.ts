import { matchesFileAccept } from "./fileAccept.util";
import { isExecutableFileType } from "./fileAccessUrl.util";

export type FileUploadValidationFailureReason = "executable" | "type" | "size";

export type FileUploadValidationResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      readonly reason: FileUploadValidationFailureReason;
      readonly message: string;
    };

export type FileUploadValidationOptions = {
  readonly accept: string;
  readonly maxSizeBytes: number;
  readonly allowedFormatsLabel?: string;
};

export const FILE_NAME_TRUNCATE_EDGE_LENGTH = 12;

export function formatTruncatedFileName(
  fileName: string,
  edgeLength: number = FILE_NAME_TRUNCATE_EDGE_LENGTH
): string {
  const trimmed = fileName.trim();
  const ellipsis = "...";
  const maxLengthBeforeTruncate = edgeLength * 2 + ellipsis.length;

  if (trimmed.length <= maxLengthBeforeTruncate) {
    return trimmed;
  }

  return `${trimmed.slice(0, edgeLength)}${ellipsis}${trimmed.slice(-edgeLength)}`;
}

export function formatUploadFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes.toLocaleString("fa-IR")} بایت`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("fa-IR", {
      maximumFractionDigits: 1,
    })} کیلوبایت`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toLocaleString("fa-IR", {
      maximumFractionDigits: 1,
    })} مگابایت`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toLocaleString("fa-IR", {
    maximumFractionDigits: 2,
  })} گیگابایت`;
}

function describeAcceptToken(token: string): string {
  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken || normalizedToken === "*/*") {
    return "همه فرمت‌ها";
  }
  if (normalizedToken === "image/*") {
    return "تصویر";
  }
  if (normalizedToken === "video/*") {
    return "ویدیو";
  }
  if (normalizedToken === "audio/*") {
    return "صوت";
  }
  if (normalizedToken === "text/*") {
    return "متن";
  }
  if (normalizedToken === "application/pdf" || normalizedToken === ".pdf") {
    return "PDF";
  }
  if (normalizedToken === ".doc") {
    return "Word (.doc)";
  }
  if (normalizedToken === ".docx") {
    return "Word (.docx)";
  }
  if (normalizedToken === ".txt") {
    return "متن (.txt)";
  }
  if (normalizedToken.startsWith(".")) {
    return normalizedToken.toUpperCase();
  }

  return normalizedToken;
}

export function describeAllowedUploadFormats(accept: string, allowedFormatsLabel?: string): string {
  const trimmedLabel = allowedFormatsLabel?.trim();
  if (trimmedLabel) {
    return trimmedLabel.replace(/^فرمت(?:\s*های)?\s*مجاز\s*:\s*/i, "");
  }

  const tokens = accept
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0 || tokens.includes("*/*")) {
    return "همه فرمت‌ها";
  }

  return [...new Set(tokens.map(describeAcceptToken))].join("، ");
}

function buildTypeValidationMessage(accept: string, allowedFormatsLabel?: string): string {
  const allowedFormats = describeAllowedUploadFormats(accept, allowedFormatsLabel);
  return `فرمت مجاز نیست. فرمت مجاز: ${allowedFormats}`;
}

export function validateSelectedUploadFile(
  file: File,
  options: FileUploadValidationOptions
): FileUploadValidationResult {
  const allowedFormats = describeAllowedUploadFormats(options.accept, options.allowedFormatsLabel);

  if (isExecutableFileType(file.type, file.name)) {
    return {
      valid: false,
      reason: "executable",
      message: `فرمت مجاز نیست. فرمت مجاز: ${allowedFormats}`,
    };
  }

  if (!matchesFileAccept(file, options.accept)) {
    return {
      valid: false,
      reason: "type",
      message: buildTypeValidationMessage(options.accept, options.allowedFormatsLabel),
    };
  }

  if (file.size > options.maxSizeBytes) {
    return {
      valid: false,
      reason: "size",
      message: "حجم فایل بیش از حد مجاز است.",
    };
  }

  return { valid: true };
}

export function getUploadValidationErrorMessage(
  validation: FileUploadValidationResult,
  fallback = "فایل انتخاب‌شده معتبر نیست."
): string {
  if (validation.valid) {
    return fallback;
  }

  return validation.message;
}

/** @deprecated Use validation.message or getUploadValidationErrorMessage instead. */
export function resolveUploadValidationErrorMessage(
  reason: FileUploadValidationFailureReason,
  fallback: string
): string {
  switch (reason) {
    case "executable":
      return "فرمت مجاز نیست.";
    case "size":
      return "حجم فایل بیش از حد مجاز است.";
    case "type":
      return fallback || "فرمت مجاز نیست.";
    default:
      return fallback;
  }
}
