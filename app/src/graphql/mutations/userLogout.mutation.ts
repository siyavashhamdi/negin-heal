import { gql } from "@apollo/client";

export const USER_LOGOUT_MUTATION = gql`
  mutation UserLogout {
    userLogout
  }
`;
