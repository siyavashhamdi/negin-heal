export const VERIFICATION_STATUS_SUBSCRIPTION_PAYLOAD_KEYS = {
  EMAIL_VERIFIED_AT: "emailVerifiedAt",
  MOBILE_VERIFIED_AT: "mobileVerifiedAt",
} as const;

export type VerificationStatusSubscriptionPayload = {
  readonly emailVerifiedAt?: string | null;
  readonly mobileVerifiedAt?: string | null;
};

export function buildVerificationStatusSubscriptionPayload(input: {
  emailVerifiedAt?: Date | null;
  mobileVerifiedAt?: Date | null;
}): VerificationStatusSubscriptionPayload {
  return {
    emailVerifiedAt: input.emailVerifiedAt?.toISOString() ?? null,
    mobileVerifiedAt: input.mobileVerifiedAt?.toISOString() ?? null,
  };
}
