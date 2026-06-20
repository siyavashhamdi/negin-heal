import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_LIST_QUERY = gql`
  query UserList($input: UserListGqlInput!) {
    userList(input: $input) {
      items {
        id
        username
        roles
        status
        profile {
          firstName
          lastName
          email
          phoneNumber
          bio
          avatarAccessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
        }
        createdAt
        updatedAt
      }
      pagination {
        limit
        skip
        total
        count
      }
    }
  }
`;
