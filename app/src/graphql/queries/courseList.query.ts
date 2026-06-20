import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const COURSE_LIST_QUERY = gql`
  query CourseList($input: CourseListGqlInput!) {
    courseList(input: $input) {
      items {
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
        sortOrder
        tags
        releaseType
        chapterCount
        itemCount
        itemTypes
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
    }
  }
`;
