import { gql } from "@apollo/client";

export const COURSE_REVIEW_MODERATION_UPDATE_MUTATION = gql`
  mutation CourseReviewModerationUpdate($input: CourseReviewModerationUpdateGqlInput!) {
    courseReviewModerationUpdate(input: $input) {
      id
      moderation {
        visibility
        hiddenAt
        hiddenReason
      }
      rating {
        stars
        moderation {
          visibility
          hiddenAt
          hiddenReason
        }
      }
      messages {
        key
        moderation {
          visibility
          hiddenAt
          hiddenReason
        }
      }
    }
  }
`;
