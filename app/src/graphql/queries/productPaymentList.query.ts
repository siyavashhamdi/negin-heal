import { gql } from "@apollo/client";

export const PRODUCT_PAYMENT_LIST_QUERY = gql`
  query ProductPaymentList($input: ProductPaymentListGqlInput!) {
    productPaymentList(input: $input) {
      items {
        id
        userId
        productId
        user {
          fullName
          username
          email
          phone
          mobilePhone
        }
        product {
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
