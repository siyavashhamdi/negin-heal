import { gql } from "@apollo/client";

export const USER_NOTIFICATION_UPDATE_MUTATION = gql`
  mutation UserNotificationUpdate($input: NotificationUpdateGqlInput!) {
    userNotificationUpdate(input: $input) {
      action
      notificationIds
      requestedCount
      matchedCount
      modifiedCount
      items {
        id
        userId
        source
        mode
        title
        message
        payload
        isRead
        readAt
        archivedAt
        visibleUntil
        createdAt
        updatedAt
      }
    }
  }
`;
