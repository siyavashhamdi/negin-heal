import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const COURSE_DETAIL_QUERY = gql`
  query CourseDetail($input: CourseDetailGqlInput!) {
    courseDetail(input: $input) {
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
      isActive
      tags
      chapters {
        title
        description
        visibleAfterMinutes
        isFree
        sortOrder
        items {
          title
          sortOrder
          fileAccessUrl {
            ${FILE_ACCESS_URL_FIELDS}
          }
          article
          type
        }
      }
    }
  }
`;
