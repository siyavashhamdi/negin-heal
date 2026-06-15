import { gql } from "@apollo/client";

export const USER_TICKET_CLOSE_MUTATION = gql`
  mutation UserTicketClose($id: ID!) {
    userTicketClose(id: $id) {
      id
      status
      closedBy
      closedAt
    }
  }
`;
