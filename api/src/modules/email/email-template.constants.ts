/**
 * Placeholders referenced by the default seeded email templates.
 * Runtime rendering still validates against the stored template text.
 */
export const EMAIL_TEMPLATE_PLACEHOLDERS = {
  PASSWORD_RESET: ["APP_NAME", "APP_URL", "RESET_CODE", "SECURITY_TEAM_NAME"],
  WELCOME: [
    "APP_NAME",
    "APP_URL",
    "ACTIVATION_URL",
    "USER_FIRST_NAME",
    "SECURITY_TEAM_NAME",
  ],
  VERIFY_EMAIL: [
    "APP_NAME",
    "APP_URL",
    "VERIFICATION_URL",
    "USER_FIRST_NAME",
    "SECURITY_TEAM_NAME",
  ],
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATE_PLACEHOLDERS;
