import { gql } from "@apollo/client";

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
          avatarFileId
          bio
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
