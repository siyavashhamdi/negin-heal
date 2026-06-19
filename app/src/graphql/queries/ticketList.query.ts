import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

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
      pagination {
        limit
        skip
        total
        count
      }
    }
  }
`;
