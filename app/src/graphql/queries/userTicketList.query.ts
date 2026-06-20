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
