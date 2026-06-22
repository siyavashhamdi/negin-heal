import {
  isValidAuthIdentityMobileInput,
  normalizeAuthIdentityMobileForSubmit,
} from "./auth-identity.util";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NORMALIZED_MOBILE_PHONE_REGEX = /^09\d{9}$/;

/** @deprecated Use AUTH_IDENTITY_LOCAL_MOBILE_REGEX from auth-identity.util */
export const AUTH_IDENTITY_MOBILE_REGEX = /^09\d{9}$/;

export { isValidEmail } from "./auth-identity.util";

/** @deprecated Use normalizeAuthIdentityMobileForSubmit */
export function normalizeMobilePhone(value: string): string | undefined {
  return normalizeAuthIdentityMobileForSubmit(value);
}

export function isValidMobilePhone(value: string): boolean {
  return isValidAuthIdentityMobileInput(value);
}

export {
  AUTH_IDENTITY_LOCAL_MOBILE_REGEX,
  detectAuthIdentityKind,
  isAuthIdentityMobile,
  isAuthIdentityMobileMode,
  isValidAuthIdentity,
  isValidAuthIdentityMobileInput,
  normalizeAuthIdentityForSubmit,
  normalizeAuthIdentityMobileForSubmit,
  resolveAuthIdentityLookup,
  tryNormalizeAuthIdentityMobile,
  type AuthIdentityKind,
  type AuthIdentityLookup,
  type AuthIdentityLookupField,
} from "./auth-identity.util";
