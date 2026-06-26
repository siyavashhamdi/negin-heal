import { gql } from "@apollo/client";

export const REGISTER_PUSH_SUBSCRIPTION_MUTATION = gql`
  mutation RegisterPushSubscription($input: RegisterPushSubscriptionGqlInput!) {
    registerPushSubscription(input: $input) {
      success
    }
  }
`;

export const UNREGISTER_PUSH_SUBSCRIPTION_MUTATION = gql`
  mutation UnregisterPushSubscription($input: UnregisterPushSubscriptionGqlInput!) {
    unregisterPushSubscription(input: $input) {
      success
    }
  }
`;
