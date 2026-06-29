import { gql } from "@apollo/client";

export const COUPON_VALIDATE_QUERY = gql`
  query CouponValidate($input: CouponValidateGqlInput!) {
    couponValidate(input: $input) {
      isValid
      message
      couponId
      code
      title
      discountType
      discountValue
      amountIrt
      productDiscountAmountIrt
      payableAmountBeforeCouponIrt
      couponDiscountAmountIrt
      finalAmountIrt
    }
  }
`;
