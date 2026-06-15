import { gql } from "@apollo/client";

export const APP_VERSION_QUERY = gql`
  query AppVersionConfig {
    appVersionConfig {
      value
    }
  }
`;
