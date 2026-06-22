import { gql } from "@apollo/client";

export const USER_ACTIVATE_ACCOUNT_MUTATION = gql`
  mutation UserActivateAccount($token: String!) {
    userActivateAccount(token: $token) {
      success
      message
    }
  }
`;
