import { gql } from "@apollo/client";

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
        avatarFileId
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
