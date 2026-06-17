import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

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
        avatarAccessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
        bio
      }
    }
  }
`;
