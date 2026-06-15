import { gql } from "@apollo/client";

export const APP_PRIVACY_POLICY_PAGE_QUERY = gql`
  query AppPrivacyPolicyPageConfig {
    appPrivacyPolicyPageConfig {
      html
    }
  }
`;
