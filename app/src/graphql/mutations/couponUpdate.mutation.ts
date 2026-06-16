import { gql } from "@apollo/client";

export const COUPON_UPDATE_MUTATION = gql`
  mutation CouponUpdate($input: CouponUpdateGqlInput!) {
    couponUpdate(input: $input) {
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
  }
`;
