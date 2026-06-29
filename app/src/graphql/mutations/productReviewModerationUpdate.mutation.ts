import { gql } from "@apollo/client";

export const PRODUCT_REVIEW_MODERATION_UPDATE_MUTATION = gql`
  mutation ProductReviewModerationUpdate($input: ProductReviewModerationUpdateGqlInput!) {
    productReviewModerationUpdate(input: $input) {
      id
      moderation {
        visibility
        hiddenAt
        hiddenReason
      }
      rating {
        stars
        moderation {
          visibility
          hiddenAt
          hiddenReason
        }
      }
      messages {
        key
        moderation {
          visibility
          hiddenAt
          hiddenReason
        }
      }
    }
  }
`;
