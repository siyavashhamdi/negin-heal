import { gql } from "@apollo/client";

export const COUPON_CREATE_MUTATION = gql`
  mutation CouponCreate($input: CouponCreateGqlInput!) {
    couponCreate(input: $input) {
      id
    }
  }
`;
