import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_PRODUCT_DETAIL_QUERY = gql`
  query UserProductDetail($input: UserProductDetailGqlInput!) {
    product: userProductDetail(input: $input) {
      id
      title
      description
      coverImageAccessUrl {
        ${FILE_ACCESS_URL_FIELDS}
      }
      priceIrt
      discount {
        type
        value
      }
      tags
      releaseType
      isFree
      isPurchased
      purchaseStatus
      completedChapterCount
      accessibleChapterCount
      isReviewSubmissionEnabled
      isReviewsSectionVisible
      chapters {
        key
        title
        description
        visibleAfterMinutes
        isFree
        isLocked
        unlocksAt
        isCompleted
        userCompletedAt
        items {
          title
          type
          fileAccessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
          article
        }
      }
    }
  }
`;
