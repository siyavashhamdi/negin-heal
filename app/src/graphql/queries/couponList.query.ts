import { gql } from "@apollo/client";

export const COUPON_LIST_QUERY = gql`
  query CouponList($input: CouponListGqlInput!) {
    couponList(input: $input) {
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
