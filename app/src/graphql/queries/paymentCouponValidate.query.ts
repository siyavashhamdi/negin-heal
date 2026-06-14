import { gql } from "@apollo/client";

export const PAYMENT_COUPON_VALIDATE_QUERY = gql`
  query PaymentCouponValidate($input: PaymentCouponValidateGqlInput!) {
    paymentCouponValidate(input: $input) {
      isValid
      message
      couponId
      code
      title
      discountType
      discountValue
      amountIrt
      courseDiscountAmountIrt
      payableAmountBeforeCouponIrt
      couponDiscountAmountIrt
      finalAmountIrt
    }
  }
`;
