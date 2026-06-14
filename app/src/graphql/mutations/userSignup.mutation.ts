import { gql } from "@apollo/client";

export const USER_SIGNUP_MUTATION = gql`
  mutation UserSignup($input: UserSignupGqlInput!) {
    userSignup(input: $input) {
      accessToken
      user {
        id
        username
        roles
      }
    }
  }
`;
