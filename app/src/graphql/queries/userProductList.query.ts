import { gql } from "@apollo/client";

import { FILE_ACCESS_URL_FIELDS } from "../fragments/fileAccessUrl.fragment";

export const USER_PRODUCT_LIST_QUERY = gql`
  query UserProductList($input: ProductListGqlInput!) {
    productList: userProductList(input: $input) {
      items {
        id
        title
        description
        coverImageAccessUrl {
          ${FILE_ACCESS_URL_FIELDS}
        }
        priceIrt
        discount {
          type
          value
        }
        tags
        releaseType
        chapterCount
        itemCount
        itemTypes
        isPurchased
      }
      pagination {
        limit
        total
        count
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
