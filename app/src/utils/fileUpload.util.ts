import { LOCAL_STORAGE_KEYS } from "../constants";
import type { FileAccessUrl } from "./fileAccessUrl.util";
import { compressImageForUpload } from "./imageCompression.util";

const FILE_UPLOAD_PATH = "/api/v1/files/upload";

export type FileUploadResult = {
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly path: string;
  readonly uploadedAt: string;
  readonly accessUrl: FileAccessUrl;
};

export class FileUploadError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "FileUploadError";
    this.statusCode = statusCode;
  }
}

function resolveUploadErrorMessage(body: unknown, fallback: string): string {
  if (typeof body !== "object" || body === null) {
    return fallback;
  }

  const error = (body as { error?: { message?: string | string[] } }).error;
  const message = error?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

export async function uploadFile(
  file: File,
  options?: { readonly accessToken?: string | null },
): Promise<FileUploadResult> {
  const token =
    options?.accessToken ?? localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) {
    throw new FileUploadError("Not authenticated", 401);
  }

  const uploadFilePayload = await compressImageForUpload(file);

  const response = await fetch(FILE_UPLOAD_PATH, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": uploadFilePayload.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(uploadFilePayload.name),
    },
    body: uploadFilePayload,
  });

  if (!response.ok) {
    let message = "File upload failed";
    try {
      message = resolveUploadErrorMessage(await response.json(), message);
    } catch {
      // Keep fallback message when the error body is not JSON.
    }
    throw new FileUploadError(message, response.status);
  }

  return (await response.json()) as FileUploadResult;
}
