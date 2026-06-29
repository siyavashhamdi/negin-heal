import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const PRODUCT_REVIEW_LIST_QUERY = gql`
  query ProductReviewList($input: ProductReviewListGqlInput!) {
    productReviewList(input: $input) {
      items {
        id
        userId
        productId
        userProductId
        user {
          id
          roles
          profile {
            firstName
            lastName
            avatarAccessUrl {
              ${FILE_ACCESS_URL_FIELDS}
            }
          }
        }
        userSnapshot {
          fullName
          username
        }
        productSnapshot {
          title
        }
        moderation {
          visibility
          hiddenAt
          hiddenReason
        }
        rating {
          stars
          comment
          ratedAt
          updatedAt
          moderation {
            visibility
            hiddenAt
            hiddenReason
          }
        }
        messages {
          key
          body
          sentAt
          senderUserId
          senderUser {
            id
            profile {
              firstName
              lastName
            }
          }
          moderation {
            visibility
            hiddenAt
            hiddenReason
          }
        }
        createdAt
        updatedAt
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
