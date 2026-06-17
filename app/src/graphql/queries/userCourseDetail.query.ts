import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_COURSE_DETAIL_QUERY = gql`
  query UserCourseDetail($input: UserCourseDetailGqlInput!) {
    course: userCourseDetail(input: $input) {
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
      chapters {
        key
        title
        description
        visibleAfterMinutes
        isFree
        isLocked
        items {
          title
          type
          isLocked
          fileAccessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
          article
        }
      }
    }
  }
`;
