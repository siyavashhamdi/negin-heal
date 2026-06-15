export type AppPrivacyPolicyPageConfig = {
  readonly html: string;
};

export type AppPrivacyPolicyPageConfigQuery = {
  readonly appPrivacyPolicyPageConfig: AppPrivacyPolicyPageConfig;
};

export const EMPTY_APP_PRIVACY_POLICY_PAGE: AppPrivacyPolicyPageConfig = {
  html: "",
};
