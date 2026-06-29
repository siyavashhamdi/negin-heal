import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const PRODUCT_PAYMENT_MANUAL_CREATE_MUTATION = gql`
  mutation ProductPaymentManualCreate($input: ProductPaymentManualCreateGqlInput!) {
    productPaymentManualCreate(input: $input) {
      id
      userId
      productId
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
