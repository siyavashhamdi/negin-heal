import { extname } from "path";

import { BadRequestException } from "@nestjs/common";

import {
  FILE_UPLOAD_POLICIES,
  FILE_UPLOAD_POLICY,
  type FileUploadPolicyId,
  type FileUploadPolicyRule,
} from "./file-upload-policy.constants";

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function resolveMimeTypeFromFileName(fileName: string): string {
  const extension = extname(fileName).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".pdf":
      return "application/pdf";
    case ".txt":
      return "text/plain";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "";
  }
}

function patternMatchesMime(pattern: string, mimeType: string): boolean {
  if (pattern.endsWith("/")) {
    return mimeType.startsWith(pattern);
  }

  if (pattern.endsWith("/*")) {
    return mimeType.startsWith(pattern.slice(0, -1));
  }

  return mimeType === pattern;
}

export function resolveFileUploadPolicy(
  policyHeader: string | undefined,
): FileUploadPolicyRule {
  const normalizedPolicy = policyHeader?.trim().toUpperCase();
  if (
    normalizedPolicy &&
    normalizedPolicy in FILE_UPLOAD_POLICIES
  ) {
    return FILE_UPLOAD_POLICIES[normalizedPolicy as FileUploadPolicyId];
  }

  return FILE_UPLOAD_POLICIES[FILE_UPLOAD_POLICY.ANY];
}

export function assertFileAllowedByPolicy(params: {
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  policy: FileUploadPolicyRule;
}): void {
  if (params.sizeBytes > params.policy.maxSizeBytes) {
    throw new BadRequestException("File size exceeds the allowed limit for this upload type");
  }

  if (params.policy.allowedMimePatterns == null) {
    return;
  }

  const normalizedMimeType =
    normalizeMimeType(params.mimeType) ||
    resolveMimeTypeFromFileName(params.fileName);
  const extension = extname(params.fileName).toLowerCase();

  const matchesMime = params.policy.allowedMimePatterns.some((pattern) =>
    patternMatchesMime(pattern, normalizedMimeType),
  );
  const matchesExtension =
    extension.length > 0 &&
    (params.policy.allowedExtensions?.includes(extension) ?? false);

  if (!matchesMime && !matchesExtension) {
    throw new BadRequestException("File type is not allowed for this upload");
  }
}
