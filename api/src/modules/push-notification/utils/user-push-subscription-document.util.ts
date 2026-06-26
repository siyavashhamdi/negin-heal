import { UserPushSubscription } from "../../../database/schemas";

type PushSubscriptionLike = {
  readonly endpoint?: unknown;
  readonly keys?: {
    readonly p256dh?: unknown;
    readonly auth?: unknown;
  };
  readonly registeredAt?: unknown;
  readonly updatedAt?: unknown;
};

export function buildUserPushSubscriptionDocument(input: {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  registeredAt: Date;
  updatedAt?: Date;
}): UserPushSubscription {
  const document: UserPushSubscription = {
    endpoint: input.endpoint.trim(),
    keys: {
      p256dh: input.keys.p256dh.trim(),
      auth: input.keys.auth.trim(),
    },
    registeredAt: input.registeredAt,
  };

  if (input.updatedAt) {
    document.updatedAt = input.updatedAt;
  }

  return document;
}

export function normalizeStoredPushSubscription(
  value: unknown,
): UserPushSubscription | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const subscription = value as PushSubscriptionLike;
  const endpoint =
    typeof subscription.endpoint === "string"
      ? subscription.endpoint.trim()
      : "";
  const p256dh =
    typeof subscription.keys?.p256dh === "string"
      ? subscription.keys.p256dh.trim()
      : "";
  const auth =
    typeof subscription.keys?.auth === "string"
      ? subscription.keys.auth.trim()
      : "";

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  const registeredAt =
    subscription.registeredAt instanceof Date
      ? subscription.registeredAt
      : typeof subscription.registeredAt === "string" ||
          typeof subscription.registeredAt === "number"
        ? new Date(subscription.registeredAt)
        : null;

  if (!registeredAt || Number.isNaN(registeredAt.getTime())) {
    return null;
  }

  const updatedAt =
    subscription.updatedAt instanceof Date
      ? subscription.updatedAt
      : typeof subscription.updatedAt === "string" ||
          typeof subscription.updatedAt === "number"
        ? new Date(subscription.updatedAt)
        : undefined;

  return buildUserPushSubscriptionDocument({
    endpoint,
    keys: { p256dh, auth },
    registeredAt,
    updatedAt:
      updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : undefined,
  });
}
