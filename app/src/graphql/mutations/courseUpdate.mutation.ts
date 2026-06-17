import { gql } from "@apollo/client";

export const COURSE_UPDATE_MUTATION = gql`
  mutation CourseUpdate($input: CourseUpdateGqlInput!) {
    courseUpdate(input: $input) {
      id
    }
  }
`;
