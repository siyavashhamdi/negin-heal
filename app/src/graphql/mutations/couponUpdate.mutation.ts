import { gql } from "@apollo/client";

export const COUPON_UPDATE_MUTATION = gql`
  mutation CouponUpdate($input: CouponUpdateGqlInput!) {
    couponUpdate(input: $input) {
      id
    }
  }
`;
