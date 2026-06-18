import { gql } from "@apollo/client";

export const COURSE_CHAPTER_COMPLETE_MUTATION = gql`
  mutation CourseChapterComplete($input: CourseChapterCompleteGqlInput!) {
    courseChapterComplete(input: $input) {
      key
      titleSnapshot
      userCompletedAt
      completedChapterCount
      accessibleChapterCount
    }
  }
`;
