import { gql } from "@apollo/client";

export const PRODUCT_CHAPTER_COMPLETE_MUTATION = gql`
  mutation ProductChapterComplete($input: ProductChapterCompleteGqlInput!) {
    productChapterComplete(input: $input) {
      key
      titleSnapshot
      userCompletedAt
      completedChapterCount
      accessibleChapterCount
    }
  }
`;
