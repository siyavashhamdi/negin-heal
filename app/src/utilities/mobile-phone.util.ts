export {
  AUTH_IDENTITY_LOCAL_MOBILE_REGEX,
  detectAuthIdentityKind,
  isAuthIdentityMobile,
  isValidAuthIdentityMobileInput,
  isValidEmail,
  normalizeAuthIdentityForSubmit,
  normalizeAuthIdentityMobileForSubmit,
  resolveAuthIdentityIconKind,
  sanitizeAuthIdentityInput,
  tryNormalizeAuthIdentityMobile,
  type AuthIdentityKind,
} from "./auth-identity.util";

export {
  EMAIL_REGEX,
  isValidMobilePhone,
  latinIdentityFieldInputProps,
  normalizeMobilePhoneToLocal,
  normalizeOptionalMobilePhoneToLocal,
  sanitizeLatinEmailInput,
  sanitizeLatinUsernameInput,
  sanitizeMobilePhoneInput,
} from "./contact-validation.util";
