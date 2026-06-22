import { gql } from "@apollo/client";

export const USER_REQUEST_EMAIL_VERIFICATION_MUTATION = gql`
  mutation UserRequestEmailVerification {
    userRequestEmailVerification {
      success
      message
    }
  }
`;
