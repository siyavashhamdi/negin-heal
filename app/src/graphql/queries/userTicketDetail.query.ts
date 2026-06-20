import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_TICKET_DETAIL_QUERY = gql`
  query UserTicketDetail($input: UserTicketDetailGqlInput!) {
    userTicketDetail(input: $input) {
      id
      title
      category
      priority
      status
      closedBy
      closedAt
      messages {
        body
        sentAt
        senderUser {
          profile {
            firstName
          }
        }
        attachmentFiles {
          name
          mimeType
          sizeBytes
          path
          accessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
        }
      }
      createdByUserId
      createdByUser {
        id
        username
        profile {
          firstName
          lastName
          avatarAccessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
        }
      }
      updatedByUserId
      updatedByUser {
        id
        username
        profile {
          firstName
          lastName
          avatarAccessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;
