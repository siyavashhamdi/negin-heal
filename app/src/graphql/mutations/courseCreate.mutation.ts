import { gql } from "@apollo/client";

export const COURSE_CREATE_MUTATION = gql`
  mutation CourseCreate($input: CourseCreateGqlInput!) {
    courseCreate(input: $input) {
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
