import { toWesternDigits } from "./persian-digits.util";
import {
  AUTH_IDENTITY_CHARSET_REGEX,
  AUTH_IDENTITY_LOCAL_MOBILE_REGEX,
  detectAuthIdentityKind,
  EMAIL_REGEX,
  isAuthIdentityMobile,
  isLatinEmailValue,
  isLatinIdentityUsername,
  isLatinUsername,
  isValidAuthIdentity,
  isValidEmail,
  LATIN_EMAIL_CHARSET_REGEX,
  LATIN_USERNAME_REGEX,
  isAuthIdentityMobileMode,
  isValidAuthIdentityMobileInput,
  normalizeAuthIdentityForSubmit,
  normalizeAuthIdentityMobileForSubmit,
  resolveAuthIdentityIconKind,
  resolveAuthIdentityValidationMessageKey,
  resolveInvalidAuthIdentityErrorKind,
  sanitizeAuthIdentityInput,
  tryNormalizeAuthIdentityMobile,
  validateSubmittedAuthIdentity,
  type AuthIdentityKind,
  type AuthIdentityValidationErrorKind,
  type SubmittedAuthIdentityValidationError,
  type SubmittedAuthIdentityValidationResult,
} from "./auth-identity.util";

export {
  AUTH_IDENTITY_CHARSET_REGEX,
  AUTH_IDENTITY_LOCAL_MOBILE_REGEX,
  detectAuthIdentityKind,
  EMAIL_REGEX,
  isAuthIdentityMobile,
  isLatinEmailValue,
  isLatinIdentityUsername,
  isLatinUsername,
  isValidAuthIdentity,
  isValidEmail,
  LATIN_EMAIL_CHARSET_REGEX,
  LATIN_USERNAME_REGEX,
  isAuthIdentityMobileMode,
  isValidAuthIdentityMobileInput,
  normalizeAuthIdentityForSubmit,
  normalizeAuthIdentityMobileForSubmit,
  resolveAuthIdentityIconKind,
  resolveAuthIdentityValidationMessageKey,
  resolveInvalidAuthIdentityErrorKind,
  sanitizeAuthIdentityInput,
  tryNormalizeAuthIdentityMobile,
  validateSubmittedAuthIdentity,
  type AuthIdentityKind,
  type AuthIdentityValidationErrorKind,
  type SubmittedAuthIdentityValidationError,
  type SubmittedAuthIdentityValidationResult,
};

export const latinIdentityFieldInputProps = {
  lang: "en",
  dir: "ltr",
  spellCheck: false,
  autoCapitalize: "off",
  autoCorrect: "off",
} as const;

const NON_ALPHANUMERIC_START = /^[^a-zA-Z0-9]+/;
const NON_MOBILE_START = /^[^0-9+]+/;

const NON_LATIN_USERNAME = /[^a-zA-Z0-9._-]/g;
const NON_LATIN_EMAIL = /[^a-zA-Z0-9@._+-]/g;
const NON_MOBILE_DIGITS = /[^\d+]/g;

function enforceLatinIdentityStart(value: string): string {
  return value.replace(NON_ALPHANUMERIC_START, "");
}

function enforceMobileInputStart(value: string): string {
  return value.replace(NON_MOBILE_START, "");
}

export const sanitizeLatinUsernameInput = (value: string): string =>
  enforceLatinIdentityStart(toWesternDigits(value).replace(NON_LATIN_USERNAME, ""));

export const sanitizeLatinEmailInput = (value: string): string =>
  enforceLatinIdentityStart(toWesternDigits(value).replace(NON_LATIN_EMAIL, ""));

export const sanitizeMobilePhoneInput = (value: string): string =>
  enforceMobileInputStart(toWesternDigits(value).replace(NON_MOBILE_DIGITS, ""));

/** @deprecated Use normalizeAuthIdentityMobileForSubmit */
export const normalizeMobilePhoneToLocal = normalizeAuthIdentityMobileForSubmit;

export const normalizeOptionalMobilePhoneToLocal = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return normalizeAuthIdentityMobileForSubmit(trimmed);
};

export const isValidMobilePhone = isValidAuthIdentityMobileInput;

/** @deprecated Use AUTH_IDENTITY_LOCAL_MOBILE_REGEX */
export const AUTH_IDENTITY_MOBILE_REGEX = AUTH_IDENTITY_LOCAL_MOBILE_REGEX;
