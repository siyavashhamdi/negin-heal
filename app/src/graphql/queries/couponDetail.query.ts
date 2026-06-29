import { gql } from "@apollo/client";

export const COUPON_DETAIL_QUERY = gql`
  query CouponDetail($input: CouponDetailGqlInput!) {
    couponDetail(input: $input) {
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
      applicableProductIds
      isFirstPurchaseOnly
      isActive
      totalUsageCount
      remainingTotalUsageCount
      createdBy
      updatedBy
      createdAt
      updatedAt
    }
  }
`;
