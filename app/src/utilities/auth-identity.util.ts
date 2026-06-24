import { toWesternDigits } from "./persian-digits.util";
import { isValidUsernameLength } from "../utils/usernamePolicy.util";

/**
 * Combined auth identity field (username | email | mobile).
 *
 * Charset: start with letter, digit, or +; then letters, digits, - _ @ . +
 *
 * Kind detection:
 * - @ present → email
 * - mobile mode → mobile (see isAuthIdentityMobileMode)
 * - otherwise → username
 *
 * Mobile mode (icon + strict validation):
 * - 0 / 09… without letters → mobile
 * - + prefix → mobile (+989 must be exact +989xxxxxxxxx; else at least +xxxxxxxx)
 * - 9 prefix (not 09) → only exact 9xxxxxxxxx or 989xxxxxxxxx
 *
 * Valid mobile:
 * - Local: 09xxxxxxxxx | 9xxxxxxxxx | 989xxxxxxxxx → normalizes to 09xxxxxxxxx
 * - +989xxxxxxxxx → normalizes to 09xxxxxxxxx
 * - Other + numbers → + followed by at least 8 digits (not +989… unless exact length above)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalized local mobile: 09 + 9 digits. */
export const AUTH_IDENTITY_LOCAL_MOBILE_REGEX = /^09\d{9}$/;

const MOBILE_SHORT_REGEX = /^9\d{9}$/;
const MOBILE_INTL_REGEX = /^\+989\d{9}$/;
const MOBILE_INTL_NO_PLUS_REGEX = /^989\d{9}$/;
/** + followed by at least 8 digits (non-Iran +989… formats). */
const PLUS_MOBILE_MIN_REGEX = /^\+\d{8,}$/;

const NON_AUTH_IDENTITY_START = /^[^a-zA-Z0-9+]+/;
const NON_LATIN_AUTH_IDENTITY = /[^a-zA-Z0-9@._+-]/g;
const HAS_ALPHA_LETTER = /[a-zA-Z]/;

export const AUTH_IDENTITY_CHARSET_REGEX = /^[a-zA-Z0-9+][a-zA-Z0-9@._+-]*$/;
export const LATIN_USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/i;
export const LATIN_EMAIL_CHARSET_REGEX = /^[a-zA-Z0-9+][a-zA-Z0-9@._+-]*$/;

export type AuthIdentityKind = "email" | "mobile" | "username";
export type AuthIdentityValidationErrorKind = "email" | "mobile" | "identity" | "usernameMinLength";

function normalizeIdentityValue(value: string): string {
  return toWesternDigits(value.trim());
}

function enforceLatinAuthIdentityStart(value: string): string {
  return value.replace(NON_AUTH_IDENTITY_START, "");
}

export const sanitizeAuthIdentityInput = (value: string): string =>
  enforceLatinAuthIdentityStart(toWesternDigits(value).replace(NON_LATIN_AUTH_IDENTITY, ""));

export const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
};

export const isLatinUsername = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && LATIN_USERNAME_REGEX.test(trimmed);
};

/** Identity-field username: same charset as combined identity input (allows +). */
export const isLatinIdentityUsername = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && AUTH_IDENTITY_CHARSET_REGEX.test(trimmed);
};

export const isLatinEmailValue = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && LATIN_EMAIL_CHARSET_REGEX.test(trimmed) && isValidEmail(trimmed);
};

/**
 * Valid mobile only when the entire value is exactly one of:
 * 09xxxxxxxxx | 9xxxxxxxxx | +989xxxxxxxxx | 989xxxxxxxxx (x = digit).
 * Returns local 09xxxxxxxxx or undefined.
 */
export const tryNormalizeAuthIdentityMobile = (value: string): string | undefined => {
  const normalized = normalizeIdentityValue(value);

  if (AUTH_IDENTITY_LOCAL_MOBILE_REGEX.test(normalized)) {
    return normalized;
  }
  if (MOBILE_INTL_REGEX.test(normalized)) {
    return `0${normalized.slice(3)}`;
  }
  if (MOBILE_INTL_NO_PLUS_REGEX.test(normalized)) {
    return `0${normalized.slice(2)}`;
  }
  if (MOBILE_SHORT_REGEX.test(normalized)) {
    return `0${normalized}`;
  }

  return undefined;
};

function isValidPlusPrefixedMobile(value: string): boolean {
  if (value.startsWith("+989")) {
    return MOBILE_INTL_REGEX.test(value);
  }

  return PLUS_MOBILE_MIN_REGEX.test(value);
}

function isValidAuthIdentityMobileValue(value: string): boolean {
  const normalized = normalizeIdentityValue(value);

  if (normalized.startsWith("+")) {
    return isValidPlusPrefixedMobile(normalized);
  }

  return tryNormalizeAuthIdentityMobile(normalized) !== undefined;
}

/** Validates a dedicated mobile field using the same rules as login identity mobile mode. */
export const isValidAuthIdentityMobileInput = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && isValidAuthIdentityMobileValue(trimmed);
};

/** Normalizes a valid mobile for submit (local 09… or unchanged + numbers). */
export const normalizeAuthIdentityMobileForSubmit = (value: string): string | undefined => {
  const normalized = normalizeIdentityValue(value);

  if (!normalized || !isValidAuthIdentityMobileValue(normalized)) {
    return undefined;
  }

  const localMobile = tryNormalizeAuthIdentityMobile(normalized);
  if (localMobile) {
    return localMobile;
  }

  return normalized;
};

/** True when the UI should show mobile mode (phone icon / mobile validation path). */
export const isAuthIdentityMobileMode = (value: string): boolean => {
  const normalized = normalizeIdentityValue(value);

  if (!normalized || normalized.includes("@")) {
    return false;
  }

  if (normalized === "0" || normalized.startsWith("09")) {
    return !HAS_ALPHA_LETTER.test(normalized);
  }

  if (normalized.startsWith("+")) {
    return true;
  }

  if (normalized.startsWith("9")) {
    return tryNormalizeAuthIdentityMobile(normalized) !== undefined;
  }

  return false;
};

export const isValidAuthIdentity = (value: string): boolean => {
  const trimmed = value.trim();

  if (!trimmed || !AUTH_IDENTITY_CHARSET_REGEX.test(trimmed)) {
    return false;
  }
  if (trimmed.includes("@")) {
    return isLatinEmailValue(trimmed);
  }
  if (isAuthIdentityMobileMode(trimmed)) {
    return isValidAuthIdentityMobileValue(trimmed);
  }

  return isValidUsernameLength(trimmed);
};

export const detectAuthIdentityKind = (identity: string): AuthIdentityKind => {
  const trimmed = identity.trim();

  if (!trimmed) {
    return "username";
  }
  if (trimmed.includes("@")) {
    return "email";
  }
  if (isAuthIdentityMobileMode(trimmed)) {
    return "mobile";
  }

  return "username";
};

export const resolveInvalidAuthIdentityErrorKind = (
  value: string
): AuthIdentityValidationErrorKind => {
  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return "email";
  }
  if (detectAuthIdentityKind(trimmed) === "mobile") {
    return "mobile";
  }

  if (!isValidUsernameLength(trimmed)) {
    return "usernameMinLength";
  }

  return "identity";
};

export const normalizeAuthIdentityForSubmit = (value: string): string => {
  const sanitized = sanitizeAuthIdentityInput(value.trim());

  if (sanitized.includes("@")) {
    return sanitized.toLowerCase();
  }

  const localMobile = tryNormalizeAuthIdentityMobile(sanitized);
  if (localMobile) {
    return localMobile;
  }

  return sanitized.toLowerCase();
};

export const resolveAuthIdentityIconKind = (identity: string): AuthIdentityKind => {
  if (!identity.trim()) {
    return "username";
  }

  return detectAuthIdentityKind(sanitizeAuthIdentityInput(identity));
};

export const isAuthIdentityMobile = (value: string): boolean =>
  tryNormalizeAuthIdentityMobile(value) !== undefined;

export type SubmittedAuthIdentityValidationError = "required" | AuthIdentityValidationErrorKind;

export type SubmittedAuthIdentityValidationResult =
  | {
      ok: true;
      trimmed: string;
      normalized: string;
      kind: AuthIdentityKind;
    }
  | {
      ok: false;
      error: SubmittedAuthIdentityValidationError;
    };

export const validateSubmittedAuthIdentity = (
  value: string
): SubmittedAuthIdentityValidationResult => {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: "required" };
  }

  if (!isValidAuthIdentity(trimmed)) {
    return {
      ok: false,
      error: resolveInvalidAuthIdentityErrorKind(trimmed),
    };
  }

  const normalized = normalizeAuthIdentityForSubmit(trimmed);

  return {
    ok: true,
    trimmed,
    normalized,
    kind: detectAuthIdentityKind(normalized),
  };
};

export const resolveAuthIdentityValidationMessageKey = (
  error: SubmittedAuthIdentityValidationError,
  options?: { requiredMessageKey?: string }
): string => {
  if (error === "required") {
    return options?.requiredMessageKey ?? "auth.login.errors.identityRequired";
  }

  if (error === "email") {
    return "auth.login.errors.invalidEmail";
  }

  if (error === "mobile") {
    return "auth.login.errors.invalidMobile";
  }

  if (error === "usernameMinLength") {
    return "auth.login.errors.usernameMinLength";
  }

  return "auth.login.errors.identityInvalid";
};
