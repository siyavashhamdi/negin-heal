import { gql } from "@apollo/client";

export const USER_COURSE_DETAIL_QUERY = gql`
  query UserCourseDetail($input: UserCourseDetailGqlInput!) {
    course: userCourseDetail(input: $input) {
      id
      title
      description
      coverImageFileId
      priceIrt
      discount {
        type
        value
      }
      tags
      releaseType
      isFree
      isPurchased
      purchaseStatus
      chapters {
        key
        title
        description
        iconFileId
        visibleAfterMinutes
        isFree
        isLocked
        items {
          title
          type
          isLocked
          fileId
          article
        }
      }
    }
  }
`;
