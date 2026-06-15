import { gql } from "@apollo/client";

export const APP_ABOUT_PAGE_QUERY = gql`
  query AppAboutPageConfig {
    appAboutPageConfig {
      html
    }
  }
`;
