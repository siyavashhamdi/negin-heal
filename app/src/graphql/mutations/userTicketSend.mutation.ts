import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_TICKET_SEND_MUTATION = gql`
  mutation UserTicketSend($input: UserTicketSendGqlInput!) {
    userTicketSend(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;
