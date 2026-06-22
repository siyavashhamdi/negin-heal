import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

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
        email
        phoneNumber
        avatarAccessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
        bio
      }
      preferences {
        timezone
        notificationsEnabled
        theme
      }
      verification {
        emailVerifiedAt
        mobileVerifiedAt
      }
    }
  }
`;
