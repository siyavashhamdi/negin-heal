import { gql } from "@apollo/client";

export const COUPON_DELETE_MUTATION = gql`
  mutation CouponDelete($input: CouponDeleteGqlInput!) {
    couponDelete(input: $input)
  }
`;
