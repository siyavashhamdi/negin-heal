import { gql } from "@apollo/client";

export const TICKET_LIST_QUERY = gql`
  query TicketList($input: TicketListGqlInput!) {
    ticketList(input: $input) {
      items {
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
      pagination {
        limit
        skip
        total
        count
      }
    }
  }
`;
