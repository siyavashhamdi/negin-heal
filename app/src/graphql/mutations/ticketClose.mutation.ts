import { gql } from "@apollo/client";

export const TICKET_CLOSE_MUTATION = gql`
  mutation TicketClose($id: ID!) {
    ticketClose(id: $id) {
      id
      status
      closedBy
      closedAt
    }
  }
`;
