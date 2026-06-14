import { gql } from "@apollo/client";

export const USER_REQUEST_LOGIN_CODE_MUTATION = gql`
  mutation UserRequestLoginCode($input: UserRequestLoginCodeGqlInput!) {
    requestLoginCode(input: $input) {
      success
      message
    }
  }
`;
