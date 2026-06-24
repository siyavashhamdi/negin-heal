import i18n from "i18next";

const KNOWN_SUCCESS_CODES = new Set([
  "LOGIN_CODE_SENT",
  "SIGNUP_CODE_SENT",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_SUCCESSFUL",
  "LOGIN_SUCCESSFUL",
  "EMAIL_ALREADY_VERIFIED",
  "EMAIL_VERIFIED",
  "VERIFICATION_EMAIL_SENT",
]);

export function resolveSuccessMessage(
  message: string | null | undefined,
  fallbackKey: string
): string {
  const normalized = message?.trim();
  if (!normalized) {
    return i18n.t(fallbackKey);
  }

  if (KNOWN_SUCCESS_CODES.has(normalized)) {
    const translated = i18n.t(`success.${normalized}`, { defaultValue: "" });
    if (translated && translated !== `success.${normalized}`) {
      return translated;
    }
  }

  return i18n.t(fallbackKey);
}
