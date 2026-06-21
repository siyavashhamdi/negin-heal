import { toWesternDigits } from "../../utilities/persian-digits.util";
import { type LoginNavState } from "./login-nav-state";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^(?:\+?98|0)?9\d{9}$/;

/** Username, email, and mobile — Latin digits/letters and common email/mobile symbols only. */
const AUTH_IDENTITY_ALLOWED_CHARS = /[^a-zA-Z0-9@._+-]/g;

export const sanitizeAuthIdentityInput = (value: string): string =>
  toWesternDigits(value).replace(AUTH_IDENTITY_ALLOWED_CHARS, "");

export const createForgotPasswordPrefill = (
  identity?: LoginNavState | null,
): string => identity?.identity ?? "";

export const detectPasswordResetIdentityKind = (
  identity: string,
): LoginNavState["identityKind"] => {
  const trimmedIdentity = identity.trim();
  const digitsOnly = trimmedIdentity.replace(/\D/g, "");

  if (EMAIL_REGEX.test(trimmedIdentity)) {
    return "email";
  }

  if (MOBILE_REGEX.test(trimmedIdentity) || /^9\d{9}$/.test(digitsOnly)) {
    return "mobile";
  }

  return "username";
};
