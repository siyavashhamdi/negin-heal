import { gql } from "@apollo/client";

export const PRODUCT_DELETE_DEPENDENCIES_QUERY = gql`
  query ProductDeleteDependencies($input: ProductDeleteGqlInput!) {
    productDeleteDependencies(input: $input) {
      productId
      productTitle
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
