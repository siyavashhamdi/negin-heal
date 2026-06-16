import { gql } from "@apollo/client";

export const PAYMENT_COUPON_CREATE_MUTATION = gql`
  mutation PaymentCouponCreate($input: PaymentCouponCreateGqlInput!) {
    paymentCouponCreate(input: $input) {
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
