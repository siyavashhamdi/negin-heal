import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_DETAIL_QUERY = gql`
  query UserDetail($input: UserDetailGqlInput!) {
    userDetail(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;
