import { NativePushPlatform } from "../../../enums";
import { UserNativePushToken } from "../../../database/schemas";

type NativePushTokenLike = {
  readonly token?: unknown;
  readonly platform?: unknown;
  readonly registeredAt?: unknown;
  readonly updatedAt?: unknown;
};

export function buildUserNativePushTokenDocument(input: {
  token: string;
  platform: NativePushPlatform;
  registeredAt: Date;
  updatedAt?: Date;
}): UserNativePushToken {
  const document: UserNativePushToken = {
    token: input.token.trim(),
    platform: input.platform,
    registeredAt: input.registeredAt,
  };

  if (input.updatedAt) {
    document.updatedAt = input.updatedAt;
  }

  return document;
}

export function normalizeStoredNativePushToken(
  value: unknown,
): UserNativePushToken | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const tokenRecord = value as NativePushTokenLike;
  const token =
    typeof tokenRecord.token === "string" ? tokenRecord.token.trim() : "";
  const platform =
    typeof tokenRecord.platform === "string"
      ? (tokenRecord.platform as NativePushPlatform)
      : null;

  if (!token || platform !== NativePushPlatform.ANDROID) {
    return null;
  }

  const registeredAt =
    tokenRecord.registeredAt instanceof Date
      ? tokenRecord.registeredAt
      : typeof tokenRecord.registeredAt === "string" ||
          typeof tokenRecord.registeredAt === "number"
        ? new Date(tokenRecord.registeredAt)
        : null;

  if (!registeredAt || Number.isNaN(registeredAt.getTime())) {
    return null;
  }

  const updatedAt =
    tokenRecord.updatedAt instanceof Date
      ? tokenRecord.updatedAt
      : typeof tokenRecord.updatedAt === "string" ||
          typeof tokenRecord.updatedAt === "number"
        ? new Date(tokenRecord.updatedAt)
        : undefined;

  return buildUserNativePushTokenDocument({
    token,
    platform,
    registeredAt,
    updatedAt:
      updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : undefined,
  });
}
