import { gql } from "@apollo/client";

export const APP_TERMS_OF_USE_PAGE_QUERY = gql`
  query AppTermsOfUsePageConfig {
    appTermsOfUsePageConfig {
      html
    }
  }
`;
