import { gql } from "@apollo/client";

export const PAYMENT_COUPON_DELETE_MUTATION = gql`
  mutation PaymentCouponDelete($input: PaymentCouponDeleteGqlInput!) {
    paymentCouponDelete(input: $input)
  }
`;
