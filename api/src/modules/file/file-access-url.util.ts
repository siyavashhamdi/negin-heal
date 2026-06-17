import { Types } from "mongoose";

import { env } from "../../config";
import { FileAccessUrlGqlResponse } from "./graphql/responses";

export type FileAccessUrlDescriptor = FileAccessUrlGqlResponse;

export type AvatarProfileFields = {
  avatarFileId?: Types.ObjectId | null;
  avatarAccessUrl?: FileAccessUrlDescriptor | null;
};

export function resolveAvatarProfileFields(
  avatarFileId: Types.ObjectId | string | null | undefined,
  avatarAccessUrlMap?: Map<string, FileAccessUrlDescriptor>,
): AvatarProfileFields {
  if (!avatarFileId) {
    return {
      avatarFileId: null,
      avatarAccessUrl: null,
    };
  }

  const fileId = avatarFileId.toString();
  const avatarAccessUrl = avatarAccessUrlMap?.get(fileId);

  if (!avatarAccessUrl) {
    return {
      avatarFileId: null,
      avatarAccessUrl: null,
    };
  }

  return {
    avatarFileId: new Types.ObjectId(fileId),
    avatarAccessUrl,
  };
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
): FileAccessUrlDescriptor {
  return {
    baseUrl: getPublicAppBaseUrl(),
    apiPath: getFileAccessApiPath(),
    fileId: new Types.ObjectId(fileId.toString()),
    token,
  };
}
