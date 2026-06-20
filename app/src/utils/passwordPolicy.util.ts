export const MIN_PASSWORD_LENGTH = 8;

export type PasswordRuleId = "length" | "uppercase" | "lowercase" | "number" | "special";

export type PasswordRule = {
  readonly id: PasswordRuleId;
  readonly passed: boolean;
  readonly labelKey: string;
};

export const getPasswordRules = (password: string): readonly PasswordRule[] => [
  {
    id: "length",
    passed: password.trim().length >= MIN_PASSWORD_LENGTH,
    labelKey: "auth.login.passwordRuleLength",
  },
  {
    id: "uppercase",
    passed: /[A-Z]/.test(password),
    labelKey: "auth.login.passwordRuleUppercase",
  },
  {
    id: "lowercase",
    passed: /[a-z]/.test(password),
    labelKey: "auth.login.passwordRuleLowercase",
  },
  {
    id: "number",
    passed: /\d/.test(password),
    labelKey: "auth.login.passwordRuleNumber",
  },
  {
    id: "special",
    passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password),
    labelKey: "auth.login.passwordRuleSpecial",
  },
];

export const arePasswordRulesPassed = (password: string): boolean =>
  getPasswordRules(password).every((rule) => rule.passed);
