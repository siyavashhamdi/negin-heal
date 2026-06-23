import { gql } from "@apollo/client";

export const USER_COURSE_REVIEW_LIST_QUERY = gql`
  query UserCourseReviewList($input: UserCourseReviewListGqlInput!) {
    userCourseReviewList(input: $input) {
      items {
        id
        isMine
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
    }
  }
`;
