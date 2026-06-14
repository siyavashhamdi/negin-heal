import { gql } from "@apollo/client";

export const USER_UPDATE_MUTATION = gql`
  mutation UserUpdate($input: UserUpdateGqlInput!) {
    userUpdate(input: $input) {
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
