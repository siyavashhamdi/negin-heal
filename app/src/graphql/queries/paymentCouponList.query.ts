import { gql } from "@apollo/client";

export const PAYMENT_COUPON_LIST_QUERY = gql`
  query PaymentCouponList($input: PaymentCouponListGqlInput!) {
    paymentCouponList(input: $input) {
      items {
        id
        code
        title
        description
        discountType
        discountValue
        startsAt
        expiresAt
        totalUsageLimit
        perUserUsageLimit
        applicableCourseIds
        isFirstPurchaseOnly
        isActive
        totalUsageCount
        remainingTotalUsageCount
        createdBy
        updatedBy
        createdAt
        updatedAt
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
