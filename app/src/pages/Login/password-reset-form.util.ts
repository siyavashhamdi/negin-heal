import { detectAuthIdentityKind } from "../../utilities/auth-identity.util";
import { type LoginNavState } from "./login-nav-state";

export {
  detectAuthIdentityKind,
  EMAIL_REGEX,
  isAuthIdentityMobile,
  isLatinEmailValue,
  isLatinUsername,
  isLatinIdentityUsername,
  isValidAuthIdentity,
  isValidEmail,
  isAuthIdentityMobileMode,
  normalizeAuthIdentityForSubmit,
  resolveAuthIdentityIconKind,
  resolveInvalidAuthIdentityErrorKind,
  sanitizeAuthIdentityInput,
  tryNormalizeAuthIdentityMobile,
} from "../../utilities/auth-identity.util";

export {
  isValidMobilePhone,
  latinIdentityFieldInputProps,
  normalizeMobilePhoneToLocal,
  sanitizeLatinEmailInput,
  sanitizeLatinUsernameInput,
} from "../../utilities/contact-validation.util";

export const createForgotPasswordPrefill = (
  identity?: LoginNavState | null,
): string => identity?.identity ?? "";

export const detectPasswordResetIdentityKind = (
  identity: string,
): LoginNavState["identityKind"] => detectAuthIdentityKind(identity);
