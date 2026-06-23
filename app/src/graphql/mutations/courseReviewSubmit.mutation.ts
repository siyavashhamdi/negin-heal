import { gql } from "@apollo/client";

export const COURSE_REVIEW_SUBMIT_MUTATION = gql`
  mutation CourseReviewSubmit($input: CourseReviewSubmitGqlInput!) {
    courseReviewSubmit(input: $input) {
      id
      courseId
      isNewRating
      rating {
        stars
        comment
        ratedAt
        updatedAt
      }
    }
  }
`;
