import { gql } from "@apollo/client";

export const USER_PRODUCT_REVIEW_LIST_QUERY = gql`
  query UserProductReviewList($input: UserProductReviewListGqlInput!) {
    userProductReviewList(input: $input) {
      items {
        id
        isMine
        isSubmissionBlocked
        isRatingHidden
        author {
          firstName
        }
        rating {
          stars
          comment
          ratedAt
          updatedAt
        }
        messages {
          key
          body
          sentAt
          sender {
            firstName
            isSupport
          }
        }
      }
      pagination {
        limit
        total
        count
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      summary {
        averageRating
        ratedCount
        distribution {
          stars
          count
          percentage
        }
      }
    }
  }
`;
