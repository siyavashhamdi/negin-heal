import { gql } from "@apollo/client";

export const USER_CREATE_MUTATION = gql`
  mutation UserCreate($input: UserCreateGqlInput!) {
    userCreate(input: $input) {
      id
      username
      roles
      status
      profile {
        firstName
        lastName
        email
        phoneNumber
        avatarFileId
        bio
      }
    }
  }
`;
