import { extname } from "path";

import { BadRequestException } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../constants/exception.constant";

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
  if (normalizedPolicy && normalizedPolicy in FILE_UPLOAD_POLICIES) {
    return FILE_UPLOAD_POLICIES[normalizedPolicy as FileUploadPolicyId];
  }

  return FILE_UPLOAD_POLICIES[FILE_UPLOAD_POLICY.ANY];
}

function describePolicyAllowedFormats(policy: FileUploadPolicyRule): string {
  if (policy.allowedMimePatterns == null) {
    return "همه";
  }

  const labels: string[] = [];
  for (const pattern of policy.allowedMimePatterns) {
    if (pattern === "image/") {
      labels.push("تصویر");
    } else if (pattern === "video/") {
      labels.push("ویدیو");
    } else if (pattern === "audio/") {
      labels.push("صوت");
    } else if (pattern === "text/") {
      labels.push("متن");
    } else if (pattern === "application/pdf") {
      labels.push("PDF");
    } else {
      labels.push(pattern);
    }
  }

  if (policy.allowedExtensions?.includes(".doc")) {
    labels.push("Word (.doc)");
  }
  if (policy.allowedExtensions?.includes(".docx")) {
    labels.push("Word (.docx)");
  }
  if (policy.allowedExtensions?.includes(".txt")) {
    labels.push("متن (.txt)");
  }

  return [...new Set(labels)].join("، ") || "محدود";
}

export function assertFileAllowedByPolicy(params: {
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  policy: FileUploadPolicyRule;
}): void {
  if (params.policy.allowedMimePatterns != null) {
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
      const allowedFormats = describePolicyAllowedFormats(params.policy);
      throw new BadRequestException({
        key: EXCEPTION_CONSTANT.FILE_FORMAT_NOT_ALLOWED,
        params: { allowedFormats },
      });
    }
  }

  if (params.sizeBytes > params.policy.maxSizeBytes) {
    throw new BadRequestException(EXCEPTION_CONSTANT.FILE_SIZE_EXCEEDED);
  }
}
