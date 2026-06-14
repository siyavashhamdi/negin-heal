import { gql } from "@apollo/client";

export const USER_SEND_SAMPLE_EMAIL_MUTATION = gql`
  mutation UserSendSampleEmail($to: String) {
    userSendSampleEmail(to: $to) {
      success
      message
    }
  }
`;
