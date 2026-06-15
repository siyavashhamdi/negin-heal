import { gql } from "@apollo/client";

export const USER_FORGOT_PASSWORD_MUTATION = gql`
  mutation UserForgotPassword($input: UserForgotPasswordGqlInput!) {
    userForgotPassword(input: $input) {
      success
      message
    }
  }
`;
