import { gql } from "@apollo/client";

/**
 * User Me Query
 * Fetches the currently authenticated user's information including profile
 */
export const USER_ME_QUERY = gql`
  query Me {
    me {
      id
      username
      roles
      status
      profile {
        firstName
        lastName
        avatarFileId
      }
      preferences {
        timezone
        notificationsEnabled
        theme
      }
    }
  }
`;
