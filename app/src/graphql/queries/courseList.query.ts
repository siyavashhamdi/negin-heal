import { gql } from "@apollo/client";

export const COURSE_LIST_QUERY = gql`
  query CourseList($input: CourseListGqlInput!) {
    courseList(input: $input) {
      items {
        id
        title
        description
        coverImageFileId
        priceIrt
        discount {
            type
          value
        }
        isActive
        sortOrder
        tags
        releaseType
        chapters {
          title
          description
          iconFileId
          visibleAfterMinutes
          isFree
          sortOrder
          items {
            title
            sortOrder
            fileId
            article
            type
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
    }
  }
`;
