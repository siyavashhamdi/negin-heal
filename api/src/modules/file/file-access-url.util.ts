import { Types } from "mongoose";

import { env } from "../../config";
import { FileAccessUrlGqlResponse } from "./graphql/responses";

export type FileAccessUrlDescriptor = FileAccessUrlGqlResponse;

export function resolveAvatarAccessUrl(
  avatarFileId: Types.ObjectId | string | null | undefined,
  avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
): FileAccessUrlDescriptor | null {
  if (!avatarFileId) {
    return null;
  }

  return avatarAccessUrlMap?.get(avatarFileId.toString()) ?? null;
}

export function getFileAccessApiPath(): string {
  const prefix = (env.API_PREFIX || "api/v1").replace(/^\/|\/$/g, "");
  return `/${prefix}/files`;
}

export function getPublicAppBaseUrl(): string | undefined {
  const raw = env.APP_URL ?? env.BASE_URL;
  const trimmed = raw?.trim().replace(/\/$/, "");
  return trimmed || undefined;
}

export function createFileAccessUrlDescriptor(
  fileId: string | Types.ObjectId,
  token: string,
  name?: string,
  mimeType?: string,
  sizeBytes?: number,
): FileAccessUrlDescriptor {
  return {
    baseUrl: getPublicAppBaseUrl(),
    apiPath: getFileAccessApiPath(),
    fileId: new Types.ObjectId(fileId.toString()),
    token,
    name,
    mimeType,
    sizeBytes,
  };
}
