import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const PRODUCT_PAYMENT_STATUS_UPDATE_MUTATION = gql`
  mutation ProductPaymentStatusUpdate($input: ProductPaymentStatusUpdateGqlInput!) {
    productPaymentStatusUpdate(input: $input) {
      id
      status
      uploadedReceiptFile {
        name
        mimeType
        accessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
      }
      updatedAt
    }
  }
`;
