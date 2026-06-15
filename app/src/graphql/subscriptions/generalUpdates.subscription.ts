import { gql } from "@apollo/client";

export const GENERAL_UPDATES_SUBSCRIPTION = gql`
  subscription GeneralUpdates($updateTypes: [GeneralSubscriptionUpdateType!]) {
    generalUpdates(updateTypes: $updateTypes) {
      updateType
      targetId
      createdAt
      payload
    }
  }
`;
