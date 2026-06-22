export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NORMALIZED_MOBILE_PHONE_REGEX = /^09\d{9}$/;

/** @deprecated Use AUTH_IDENTITY_LOCAL_MOBILE_REGEX from auth-identity.util */
export const AUTH_IDENTITY_MOBILE_REGEX = /^09\d{9}$/;

const EXTENDED_ARABIC_INDIC_DIGIT = /[\u06f0-\u06f9]/gi;
const ARABIC_INDIC_DIGIT = /[\u0660-\u0669]/g;

function toWesternDigits(value: string): string {
  return value
    .replace(EXTENDED_ARABIC_INDIC_DIGIT, (ch) =>
      String(ch.charCodeAt(0) - 0x06f0),
    )
    .replace(ARABIC_INDIC_DIGIT, (ch) =>
      String(ch.charCodeAt(0) - 0x0660),
    );
}

export { isValidEmail } from "./auth-identity.util";

/** Lenient normalization for stored profile phones (digits-only extraction). */
export function normalizeMobilePhone(value: string): string | undefined {
  const digits = toWesternDigits(value.trim()).replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }
  if (/^989\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }
  return undefined;
}

export function isValidMobilePhone(value: string): boolean {
  return normalizeMobilePhone(value) !== undefined;
}

export {
  AUTH_IDENTITY_LOCAL_MOBILE_REGEX,
  detectAuthIdentityKind,
  isAuthIdentityMobile,
  isAuthIdentityMobileMode,
  isValidAuthIdentity,
  normalizeAuthIdentityForSubmit,
  tryNormalizeAuthIdentityMobile,
  type AuthIdentityKind,
} from "./auth-identity.util";
