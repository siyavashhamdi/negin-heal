import { gql } from "@apollo/client";

export const USER_NOTIFICATION_LIST_QUERY = gql`
  query UserNotificationList($input: NotificationListGqlInput!) {
    userNotificationList(input: $input) {
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
      pagination {
        limit
        total
        count
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
