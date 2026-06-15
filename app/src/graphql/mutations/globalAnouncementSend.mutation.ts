import { gql } from "@apollo/client";

export const GLOBAL_ANOUNCEMENT_SEND_MUTATION = gql`
  mutation GlobalAnouncementSend($input: GlobalAnouncementSendGqlInput!) {
    globalAnouncementSend(input: $input) {
      deliveredUsers
      activeSubscribedUsers
    }
  }
`;
