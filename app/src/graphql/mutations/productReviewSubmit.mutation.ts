import { gql } from "@apollo/client";

export const PRODUCT_REVIEW_SUBMIT_MUTATION = gql`
  mutation ProductReviewSubmit($input: ProductReviewSubmitGqlInput!) {
    productReviewSubmit(input: $input) {
      id
      productId
      isNewRating
      rating {
        stars
        comment
        ratedAt
        updatedAt
      }
    }
  }
`;
