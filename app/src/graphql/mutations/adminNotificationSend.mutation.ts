import { gql } from "@apollo/client";

export const ADMIN_NOTIFICATION_SEND_MUTATION = gql`
  mutation AdminNotificationSend($input: AdminNotificationSendGqlInput!) {
    adminNotificationSend(input: $input) {
      deliveredUsers
      activeSubscribedUsers
    }
  }
`;
