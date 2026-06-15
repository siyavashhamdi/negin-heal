import { gql } from "@apollo/client";

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
          avatarFileId
        }
      }
      closedAt
      messages {
        body
        senderUser {
          id
          username
          profile {
            firstName
            lastName
            avatarFileId
          }
        }
        attachmentFileIds
        attachmentFiles {
          id
          name
          mimeType
          sizeBytes
          path
          accessUrl
        }
      }
      createdByUserId
      createdByUser {
        id
        username
        profile {
          firstName
          lastName
          avatarFileId
        }
      }
      updatedByUserId
      updatedByUser {
        id
        username
        profile {
          firstName
          lastName
          avatarFileId
        }
      }
      createdAt
      updatedAt
    }
  }
`;
