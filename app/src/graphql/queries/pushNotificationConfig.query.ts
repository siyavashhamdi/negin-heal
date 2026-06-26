import { gql } from "@apollo/client";

export const PUSH_NOTIFICATION_CONFIG_QUERY = gql`
  query PushNotificationConfig {
    pushNotificationConfig {
      enabled
      publicKey
      nativePushEnabled
    }
  }
`;
