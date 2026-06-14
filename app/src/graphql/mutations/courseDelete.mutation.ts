import { gql } from "@apollo/client";

export const COURSE_DELETE_MUTATION = gql`
  mutation CourseDelete($input: CourseDeleteGqlInput!) {
    courseDelete(input: $input)
  }
`;
