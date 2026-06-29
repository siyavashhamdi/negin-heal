import { gql } from "@apollo/client";

export const PRODUCT_DELETE_MUTATION = gql`
  mutation ProductDelete($input: ProductDeleteGqlInput!) {
    productDelete(input: $input)
  }
`;
