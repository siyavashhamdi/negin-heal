import { gql } from "@apollo/client";

export const USER_TICKET_LIST_QUERY = gql`
  query UserTicketList($input: UserTicketListGqlInput!) {
    userTicketList(input: $input) {
      items {
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
