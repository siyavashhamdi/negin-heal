import { gql } from "@apollo/client";

export const COUPON_CREATE_MUTATION = gql`
  mutation CouponCreate($input: CouponCreateGqlInput!) {
    couponCreate(input: $input) {
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
