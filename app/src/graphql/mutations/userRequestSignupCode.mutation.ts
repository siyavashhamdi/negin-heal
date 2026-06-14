import { gql } from "@apollo/client";

export const USER_REQUEST_SIGNUP_CODE_MUTATION = gql`
  mutation UserRequestSignupCode($input: UserRequestSignupCodeGqlInput!) {
    requestSignupCode(input: $input) {
      success
      message
    }
  }
`;
