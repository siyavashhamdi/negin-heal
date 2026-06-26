import { LOCAL_STORAGE_KEYS } from "../constants";
import { resolveApiUrl } from "./apiBaseUrl.util";
import type { FileUploadPolicyId } from "../constants/fileUploadPolicies";
import { FILE_UPLOAD_POLICY_MAX_SIZE_BYTES } from "../constants/fileUploadPolicies";
import { resolveErrorMessageFromCode } from "../utilities/graphql-error.util";
import type { FileAccessUrl } from "./fileAccessUrl.util";
import { compressImageForUpload } from "./imageCompression.util";
import {
  getUploadValidationErrorMessage,
  validateSelectedUploadFile,
} from "./fileUploadValidation.util";

const FILE_UPLOAD_PATH = resolveApiUrl("/api/v1/files/upload");

/** Share of the bar reserved for compression before the network upload starts. */
const COMPRESSION_PROGRESS_SHARE = 10;

function toUploadPercent(loaded: number, total: number, phase: "prepare" | "upload"): number {
  if (total <= 0) {
    return phase === "prepare" ? 0 : COMPRESSION_PROGRESS_SHARE;
  }

  const ratio = Math.min(1, loaded / total);
  if (phase === "prepare") {
    return Math.round(ratio * COMPRESSION_PROGRESS_SHARE);
  }

  return Math.round(COMPRESSION_PROGRESS_SHARE + ratio * (100 - COMPRESSION_PROGRESS_SHARE));
}

export type FileUploadResult = {
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly path: string;
  readonly uploadedAt: string;
  readonly accessUrl: FileAccessUrl;
};

export type FileUploadProgress = {
  readonly loaded: number;
  readonly total: number;
  readonly percent: number;
};

export type FileUploadOptions = {
  readonly accessToken?: string | null;
  readonly onProgress?: (progress: FileUploadProgress) => void;
  readonly policy?: FileUploadPolicyId;
  readonly accept?: string;
  readonly maxSizeBytes?: number;
  readonly allowedFormatsLabel?: string;
};

export class FileUploadError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "FileUploadError";
    this.statusCode = statusCode;
  }
}

function resolveUploadErrorMessage(body: unknown, fallbackCode: string): string {
  if (typeof body !== "object" || body === null) {
    return resolveErrorMessageFromCode(fallbackCode);
  }

  const error = (
    body as {
      error?: {
        code?: string;
        params?: Record<string, unknown>;
        message?: string | string[];
      };
    }
  ).error;
  if (error?.code?.trim()) {
    return resolveErrorMessageFromCode(error.code, error.params);
  }

  return resolveErrorMessageFromCode(fallbackCode);
}

export async function uploadFile(
  file: File,
  options?: FileUploadOptions
): Promise<FileUploadResult> {
  const token = options?.accessToken ?? localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) {
    throw new FileUploadError(resolveErrorMessageFromCode("UNAUTHENTICATED"), 401);
  }

  const uploadPolicy = options?.policy ?? "ANY";
  const maxSizeBytes = options?.maxSizeBytes ?? FILE_UPLOAD_POLICY_MAX_SIZE_BYTES[uploadPolicy];

  const validation = validateSelectedUploadFile(file, {
    accept: options?.accept ?? "*/*",
    maxSizeBytes,
    allowedFormatsLabel: options?.allowedFormatsLabel,
  });
  if (!validation.valid) {
    throw new FileUploadError(
      getUploadValidationErrorMessage(
        validation,
        resolveErrorMessageFromCode("INTERNAL_SERVER_ERROR")
      )
    );
  }

  options?.onProgress?.({
    loaded: 0,
    total: file.size,
    percent: 0,
  });

  const uploadFilePayload = await compressImageForUpload(file);

  options?.onProgress?.({
    loaded: file.size,
    total: file.size,
    percent: toUploadPercent(file.size, file.size, "prepare"),
  });

  return new Promise<FileUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", FILE_UPLOAD_PATH);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", uploadFilePayload.type || "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(uploadFilePayload.name));
    xhr.setRequestHeader("X-Upload-Policy", uploadPolicy);

    const reportUploadProgress = (loaded: number, total: number): void => {
      if (!options?.onProgress) {
        return;
      }

      const safeTotal = total > 0 ? total : uploadFilePayload.size;
      options.onProgress({
        loaded,
        total: safeTotal,
        percent: toUploadPercent(loaded, safeTotal, "upload"),
      });
    };

    xhr.upload.onprogress = (event) => {
      const total = event.lengthComputable ? event.total : uploadFilePayload.size;
      reportUploadProgress(event.loaded, total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options?.onProgress?.({
          loaded: uploadFilePayload.size,
          total: uploadFilePayload.size,
          percent: 100,
        });
        try {
          resolve(JSON.parse(xhr.responseText) as FileUploadResult);
        } catch {
          reject(
            new FileUploadError(resolveErrorMessageFromCode("INTERNAL_SERVER_ERROR"), xhr.status)
          );
        }
        return;
      }

      let message = resolveErrorMessageFromCode("INTERNAL_SERVER_ERROR");
      try {
        message = resolveUploadErrorMessage(JSON.parse(xhr.responseText), "INTERNAL_SERVER_ERROR");
      } catch {
        // Keep fallback message when the error body is not JSON.
      }
      reject(new FileUploadError(message, xhr.status));
    };

    xhr.onerror = () => {
      reject(new FileUploadError(resolveErrorMessageFromCode("INTERNAL_SERVER_ERROR")));
    };

    xhr.onabort = () => {
      reject(new FileUploadError(resolveErrorMessageFromCode("INTERNAL_SERVER_ERROR")));
    };

    xhr.send(uploadFilePayload);
  });
}
