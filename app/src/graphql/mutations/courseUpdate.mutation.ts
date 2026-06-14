import { gql } from "@apollo/client";

export const COURSE_UPDATE_MUTATION = gql`
  mutation CourseUpdate($input: CourseUpdateGqlInput!) {
    courseUpdate(input: $input) {
      id
      title
      description
      coverImageFileId
      priceIrt
      discount {
        type
        value
      }
      isActive
      sortOrder
      tags
      releaseType
      chapters {
        title
        description
        iconFileId
        visibleAfterMinutes
        isFree
        sortOrder
        items {
          title
          sortOrder
          fileId
          article
          type
        }
      }
      createdAt
      updatedAt
    }
  }
`;
