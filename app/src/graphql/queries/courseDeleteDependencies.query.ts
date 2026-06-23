import { gql } from "@apollo/client";

export const COURSE_DELETE_DEPENDENCIES_QUERY = gql`
  query CourseDeleteDependencies($input: CourseDeleteGqlInput!) {
    courseDeleteDependencies(input: $input) {
      courseId
      courseTitle
      summary {
        retainedCount
        removedCount
        hasRetainedDependencies
        hasRemovedDependencies
      }
      groups {
        key
        impact
        totalCount
        hiddenSampleCount
        breakdown {
          key
          count
        }
        samples {
          id
          label
          meta
        }
      }
    }
  }
`;
