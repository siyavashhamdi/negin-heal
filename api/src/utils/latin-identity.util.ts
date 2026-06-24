import {
  AUTH_IDENTITY_CHARSET_REGEX,
  isValidAuthIdentity,
} from "./auth-identity.util";

const EXTENDED_ARABIC_INDIC_DIGIT = /[\u06f0-\u06f9]/gi;
const ARABIC_INDIC_DIGIT = /[\u0660-\u0669]/g;

const NON_ALPHANUMERIC_START = /^[^a-zA-Z0-9]+/;
const NON_MOBILE_START = /^[^0-9+]+/;

const NON_LATIN_USERNAME = /[^a-zA-Z0-9._-]/g;
const NON_LATIN_EMAIL = /[^a-zA-Z0-9@._+-]/g;
const NON_MOBILE_DIGITS = /[^\d+]/g;

export const LATIN_USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/i;
export { LATIN_EMAIL_CHARSET_REGEX } from "./auth-identity.util";
export const LATIN_AUTH_IDENTITY_CHARSET_REGEX = AUTH_IDENTITY_CHARSET_REGEX;

export function toWesternDigits(value: string): string {
  return value
    .replace(EXTENDED_ARABIC_INDIC_DIGIT, (ch) =>
      String(ch.charCodeAt(0) - 0x06f0),
    )
    .replace(ARABIC_INDIC_DIGIT, (ch) => String(ch.charCodeAt(0) - 0x0660));
}

function enforceLatinIdentityStart(value: string): string {
  return value.replace(NON_ALPHANUMERIC_START, "");
}

function enforceMobileInputStart(value: string): string {
  return value.replace(NON_MOBILE_START, "");
}

export function sanitizeLatinUsername(value: string): string {
  return enforceLatinIdentityStart(
    toWesternDigits(value).replace(NON_LATIN_USERNAME, ""),
  );
}

export function sanitizeLatinEmail(value: string): string {
  return enforceLatinIdentityStart(
    toWesternDigits(value).replace(NON_LATIN_EMAIL, ""),
  );
}

export { sanitizeLatinAuthIdentity } from "./auth-identity.util";

export function sanitizeLatinMobileInput(value: string): string {
  return enforceMobileInputStart(
    toWesternDigits(value).replace(NON_MOBILE_DIGITS, ""),
  );
}

export function isLatinUsername(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && LATIN_USERNAME_REGEX.test(trimmed);
}

export function isLatinIdentityUsername(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && AUTH_IDENTITY_CHARSET_REGEX.test(trimmed);
}

export function isValidLatinAuthIdentity(value: string): boolean {
  return isValidAuthIdentity(value);
}

export { isLatinEmailValue } from "./auth-identity.util";
export {
  isAuthIdentityMobileMode,
  tryNormalizeAuthIdentityMobile,
} from "./auth-identity.util";
