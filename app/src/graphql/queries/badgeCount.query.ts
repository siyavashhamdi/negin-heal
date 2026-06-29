import { gql } from "@apollo/client";

export const BADGE_COUNT_QUERY = gql`
  query BadgeCount {
    badgeCount {
      products
      payments
      notifications
      tickets
    }
  }
`;
