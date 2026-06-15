import { type LoginNavState } from "./login-nav-state";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^(?:\+?98|0)?9\d{9}$/;

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
