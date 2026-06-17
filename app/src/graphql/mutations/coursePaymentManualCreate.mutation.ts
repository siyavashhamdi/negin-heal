import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const COURSE_PAYMENT_MANUAL_CREATE_MUTATION = gql`
  mutation CoursePaymentManualCreate($input: CoursePaymentManualCreateGqlInput!) {
    coursePaymentManualCreate(input: $input) {
      id
      userId
      courseId
      status
      paymentMethod
      uploadedReceiptFile {
        name
        mimeType
        accessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
      }
      createdAt
      updatedAt
    }
  }
`;
