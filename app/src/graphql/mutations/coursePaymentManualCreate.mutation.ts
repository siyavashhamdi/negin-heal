import { gql } from "@apollo/client";

export const COURSE_PAYMENT_MANUAL_CREATE_MUTATION = gql`
  mutation CoursePaymentManualCreate($input: CoursePaymentManualCreateGqlInput!) {
    coursePaymentManualCreate(input: $input) {
      id
      userId
      courseId
      user {
        id
        fullName
        username
        email
        phone
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
      uploadedReceiptFileId
      uploadedReceiptFile {
        id
        name
        title
        mimeType
        sizeBytes
        path
        accessUrl
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
