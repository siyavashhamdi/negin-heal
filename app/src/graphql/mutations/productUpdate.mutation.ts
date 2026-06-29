import { gql } from "@apollo/client";

export const PRODUCT_UPDATE_MUTATION = gql`
  mutation ProductUpdate($input: ProductUpdateGqlInput!) {
    productUpdate(input: $input) {
      id
    }
  }
`;
