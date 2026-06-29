import { gql } from "@apollo/client";

export const PRODUCT_CREATE_MUTATION = gql`
  mutation ProductCreate($input: ProductCreateGqlInput!) {
    productCreate(input: $input) {
      id
    }
  }
`;
