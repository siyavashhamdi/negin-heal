import { gql } from "@apollo/client";

export const USER_VERIFY_LOGIN_CODE_MUTATION = gql`
  mutation UserVerifyLoginCode($input: UserVerifyLoginCodeGqlInput!) {
    verifyLoginCode(input: $input) {
      success
      message
      userId
      accessToken
    }
  }
`;
