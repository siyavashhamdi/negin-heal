import { gql } from "@apollo/client";

export const PRODUCT_PURCHASE_SUBMIT_MUTATION = gql`
  mutation ProductPurchaseSubmit($input: ProductPurchaseSubmitGqlInput!) {
    productPurchaseSubmit(input: $input) {
      id
      productId
      status
      paymentMethod
      currency
      amountIrt
      discountAmountIrt
      finalAmountIrt
      couponCode
      paymentReference
      transactionId
      paymentUrl
      paymentAuthority
      isPurchased
    }
  }
`;
