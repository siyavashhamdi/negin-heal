import { gql } from "@apollo/client";

export const COURSE_CREATE_MUTATION = gql`
  mutation CourseCreate($input: CourseCreateGqlInput!) {
    courseCreate(input: $input) {
      id
    }
  }
`;
