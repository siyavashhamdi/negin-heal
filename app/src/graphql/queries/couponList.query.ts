import { gql } from "@apollo/client";

export const COUPON_LIST_QUERY = gql`
  query CouponList($input: CouponListGqlInput!) {
    couponList(input: $input) {
      items {
        id
        code
        title
        discountType
        discountValue
        startsAt
        expiresAt
        isFirstPurchaseOnly
        isActive
        totalUsageCount
        remainingTotalUsageCount
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
