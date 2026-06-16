import { gql } from "@apollo/client";

export const PAYMENT_COUPON_UPDATE_MUTATION = gql`
  mutation PaymentCouponUpdate($input: PaymentCouponUpdateGqlInput!) {
    paymentCouponUpdate(input: $input) {
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
