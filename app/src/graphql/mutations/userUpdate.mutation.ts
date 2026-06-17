import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

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
        avatarAccessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
        bio
      }
    }
  }
`;
