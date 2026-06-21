import { EMAIL_REGEX, isValidMobilePhone } from "../../utilities/contact-validation.util";
import { toWesternDigits } from "../../utilities/persian-digits.util";
import { type LoginNavState } from "./login-nav-state";

export { EMAIL_REGEX, isValidEmail, isValidMobilePhone } from "../../utilities/contact-validation.util";

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

  if (EMAIL_REGEX.test(trimmedIdentity)) {
    return "email";
  }

  if (isValidMobilePhone(trimmedIdentity) || MOBILE_REGEX.test(trimmedIdentity)) {
    return "mobile";
  }

  return "username";
};
