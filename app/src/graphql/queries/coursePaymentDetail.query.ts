import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const COURSE_PAYMENT_DETAIL_QUERY = gql`
  query CoursePaymentDetail($input: CoursePaymentDetailGqlInput!) {
    coursePaymentDetail(input: $input) {
      id
      userId
      courseId
      user {
        id
        fullName
        username
        email
        phone
        mobilePhone
      }
      course {
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
      paidAt
      failedAt
      refundedAt
      cancelledAt
    }
  }
`;
