import { gql } from "@apollo/client";

export const USER_LOGIN_MUTATION = gql`
  mutation UserLogin($input: UserLoginGqlInput!) {
    userLogin(input: $input) {
      accessToken
      user {
        id
        username
        roles
      }
    }
  }
`;
