import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const COURSE_REVIEW_LIST_QUERY = gql`
  query CourseReviewList($input: CourseReviewListGqlInput!) {
    courseReviewList(input: $input) {
      items {
        id
        userId
        courseId
        userCourseId
        user {
          id
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
        courseSnapshot {
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
    }
  }
`;
