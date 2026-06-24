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
  resolveAuthIdentityValidationMessageKey,
  resolveInvalidAuthIdentityErrorKind,
  sanitizeAuthIdentityInput,
  tryNormalizeAuthIdentityMobile,
  validateSubmittedAuthIdentity,
  type SubmittedAuthIdentityValidationError,
} from "../../utilities/auth-identity.util";

export {
  isValidMobilePhone,
  latinIdentityFieldInputProps,
  normalizeMobilePhoneToLocal,
  sanitizeLatinEmailInput,
  sanitizeLatinUsernameInput,
} from "../../utilities/contact-validation.util";

export const createForgotPasswordPrefill = (identity?: LoginNavState | null): string =>
  identity?.identity ?? "";
