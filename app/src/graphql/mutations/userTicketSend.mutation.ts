import { gql } from "@apollo/client";

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
        senderUser {
          profile {
            firstName
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
      createdAt
      updatedAt
    }
  }
`;
