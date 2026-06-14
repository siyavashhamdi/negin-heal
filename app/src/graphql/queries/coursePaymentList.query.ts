import { gql } from "@apollo/client";

export const COURSE_PAYMENT_LIST_QUERY = gql`
  query CoursePaymentList($input: CoursePaymentListGqlInput!) {
    coursePaymentList(input: $input) {
      items {
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
      pagination {
        limit
        skip
        total
        count
      }
    }
  }
`;
