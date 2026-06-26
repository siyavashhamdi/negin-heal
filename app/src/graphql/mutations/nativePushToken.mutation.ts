import { gql } from "@apollo/client";

export const REGISTER_NATIVE_PUSH_TOKEN_MUTATION = gql`
  mutation RegisterNativePushToken($input: RegisterNativePushTokenGqlInput!) {
    registerNativePushToken(input: $input) {
      success
    }
  }
`;

export const UNREGISTER_NATIVE_PUSH_TOKEN_MUTATION = gql`
  mutation UnregisterNativePushToken($input: UnregisterNativePushTokenGqlInput!) {
    unregisterNativePushToken(input: $input) {
      success
    }
  }
`;
