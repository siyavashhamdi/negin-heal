import { VERIFICATION_STATUS_SUBSCRIPTION_PAYLOAD_KEYS } from "../constants/verification-status-subscription.constants";
import type { VerificationStatusSubscriptionPayload } from "../constants/verification-status-subscription.constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalIsoDateField(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return undefined;
}

export function parseVerificationStatusSubscriptionPayload(
  payload: unknown
): VerificationStatusSubscriptionPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  const emailVerifiedAt = parseOptionalIsoDateField(
    payload[VERIFICATION_STATUS_SUBSCRIPTION_PAYLOAD_KEYS.EMAIL_VERIFIED_AT]
  );
  const mobileVerifiedAt = parseOptionalIsoDateField(
    payload[VERIFICATION_STATUS_SUBSCRIPTION_PAYLOAD_KEYS.MOBILE_VERIFIED_AT]
  );

  if (emailVerifiedAt === undefined || mobileVerifiedAt === undefined) {
    return null;
  }

  return { emailVerifiedAt, mobileVerifiedAt };
}
