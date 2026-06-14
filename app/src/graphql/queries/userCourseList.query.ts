import { gql } from "@apollo/client";

export const USER_COURSE_LIST_QUERY = gql`
  query UserCourseList($input: CourseListGqlInput!) {
    courseList: userCourseList(input: $input) {
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
        tags
        releaseType
        chapterCount
        itemCount
        itemTypes
        isPurchased
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
