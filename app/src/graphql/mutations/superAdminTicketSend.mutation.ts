import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const SUPER_ADMIN_TICKET_SEND_MUTATION = gql`
  mutation SuperAdminTicketSend($input: SuperAdminTicketSendGqlInput!) {
    superAdminTicketSend(input: $input) {
      id
      title
      category
      priority
      status
      closedBy
      closedByUserId
      closedByUser {
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
      closedAt
      messages {
        body
        sentAt
        senderUser {
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
