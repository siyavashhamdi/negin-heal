import { gql } from "@apollo/client";

export const GENERAL_ANOUNCEMENT_SEND_MUTATION = gql`
  mutation GeneralAnouncementSend($input: GeneralAnouncementSendGqlInput!) {
    generalAnouncementSend(input: $input) {
      deliveredUsers
      activeSubscribedUsers
    }
  }
`;
