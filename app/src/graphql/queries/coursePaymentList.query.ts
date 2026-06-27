import { gql } from "@apollo/client";

export const COURSE_PAYMENT_LIST_QUERY = gql`
  query CoursePaymentList($input: CoursePaymentListGqlInput!) {
    coursePaymentList(input: $input) {
      items {
        id
        userId
        courseId
        user {
          fullName
          username
          email
          phone
          mobilePhone
        }
        course {
          title
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
          couponId
          code
          discountType
          discountValue
        }
        uploadedReceiptFile {
          accessUrl {
            fileId
          }
        }
        receiptUploadedBy
        isManualStatusChange
        manualStatusChangedBy
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
      pagination {
        limit
        skip
        total
        count
      }
    }
  }
`;
