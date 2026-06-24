export const VERIFICATION_STATUS_SUBSCRIPTION_PAYLOAD_KEYS = {
  EMAIL_VERIFIED_AT: "emailVerifiedAt",
  MOBILE_VERIFIED_AT: "mobileVerifiedAt",
} as const;

export type VerificationStatusSubscriptionPayload = {
  readonly emailVerifiedAt?: string | null;
  readonly mobileVerifiedAt?: string | null;
};

export function isUserEmailVerified(
  verification?: Pick<VerificationStatusSubscriptionPayload, "emailVerifiedAt"> | null
): boolean {
  return Boolean(verification?.emailVerifiedAt);
}

export function isUserMobileVerified(
  verification?: Pick<VerificationStatusSubscriptionPayload, "mobileVerifiedAt"> | null
): boolean {
  return Boolean(verification?.mobileVerifiedAt);
}
