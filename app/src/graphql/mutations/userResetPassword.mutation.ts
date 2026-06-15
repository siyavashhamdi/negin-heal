import { gql } from "@apollo/client";

export const USER_RESET_PASSWORD_MUTATION = gql`
  mutation UserResetPassword($input: UserResetPasswordGqlInput!) {
    userResetPassword(input: $input) {
      success
      message
    }
  }
`;
