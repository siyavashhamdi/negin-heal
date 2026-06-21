import type { FileUploadPolicyId } from "../constants/fileUploadPolicies";
import { matchesFileAccept } from "./fileAccept.util";
import { isExecutableFileType } from "./fileAccessUrl.util";

export type FileUploadValidationFailureReason = "executable" | "type" | "size";

export type FileUploadValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: FileUploadValidationFailureReason };

export type FileUploadValidationOptions = {
  readonly accept: string;
  readonly maxSizeBytes: number;
};

export function validateSelectedUploadFile(
  file: File,
  options: FileUploadValidationOptions,
): FileUploadValidationResult {
  if (isExecutableFileType(file.type, file.name)) {
    return { valid: false, reason: "executable" };
  }

  if (file.size > options.maxSizeBytes) {
    return { valid: false, reason: "size" };
  }

  if (!matchesFileAccept(file, options.accept)) {
    return { valid: false, reason: "type" };
  }

  return { valid: true };
}

export function resolveUploadValidationErrorMessage(
  reason: FileUploadValidationFailureReason,
  fallback: string,
): string {
  switch (reason) {
    case "executable":
      return "اجرای این نوع فایل مجاز نیست.";
    case "size":
      return "حجم فایل بیش از حد مجاز است.";
    case "type":
      return fallback;
    default:
      return fallback;
  }
}

export type FileUploadRequestOptions = FileUploadValidationOptions & {
  readonly policy: FileUploadPolicyId;
};
