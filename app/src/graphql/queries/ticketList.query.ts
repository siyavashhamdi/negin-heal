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
          username
          profile {
            firstName
            lastName
          }
        }
        closedAt
        createdByUserId
        createdByUser {
          username
          profile {
            firstName
            lastName
          }
        }
        updatedByUserId
        updatedByUser {
          username
          profile {
            firstName
            lastName
          }
        }
        messageCount
        lastMessageBody
        attachmentCount
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
