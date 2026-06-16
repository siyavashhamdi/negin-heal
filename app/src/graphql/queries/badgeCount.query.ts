import { gql } from "@apollo/client";

export const BADGE_COUNT_QUERY = gql`
  query BadgeCount {
    badgeCount {
      courses
      payments
      notifications
      tickets
    }
  }
`;
