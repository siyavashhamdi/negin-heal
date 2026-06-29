import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const PRODUCT_PAYMENT_DETAIL_QUERY = gql`
  query ProductPaymentDetail($input: ProductPaymentDetailGqlInput!) {
    productPaymentDetail(input: $input) {
      id
      userId
      productId
      user {
        id
        fullName
        username
        email
        phone
        mobilePhone
      }
      product {
        id
        title
        priceIrt
      }
      status
      paymentMethod
      currency
      paymentProvider
      paymentReference
      transactionId
      amountIrt
      discountPercentage
      discountAmountIrt
      finalAmountIrt
      coupon {
        id
        couponId
        code
        title
        discountType
        discountValue
      }
      uploadedReceiptFile {
        name
        title
        mimeType
        sizeBytes
        path
        accessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
      }
      receiptUploadedBy
      receiptUploader {
        id
        fullName
        username
        email
        phone
      }
      isManualStatusChange
      submittedInitiallyByAdmin
      createdBy
      createdByUser {
        id
        fullName
        username
        email
        phone
      }
      statusChangedBy
      manualStatusChangedBy
      manualStatusChanger {
        id
        fullName
        username
        email
        phone
      }
      manualStatusChangedDescription
      createdAt
      updatedAt
      pendingAt
      gatewayPendingAt
      paidAt
      failedAt
      refundedAt
      cancelledAt
    }
  }
`;
