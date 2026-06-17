import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_PROFILE_UPDATE_MUTATION = gql`
  mutation UserProfileUpdate($input: UserProfileUpdateGqlInput!) {
    userProfileUpdate(input: $input) {
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
        language
        timezone
        notificationsEnabled
        theme
      }
    }
  }
`;
