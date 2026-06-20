import { gql } from "@apollo/client";

export const USER_PICKER_LIST_QUERY = gql`
  query UserPickerList($input: UserListGqlInput!) {
    userList(input: $input) {
      items {
        id
        username
        profile {
          firstName
          lastName
          email
          phoneNumber
        }
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
