import { gql } from "@apollo/client";

export const COURSE_PURCHASE_SUBMIT_MUTATION = gql`
  mutation CoursePurchaseSubmit($input: CoursePurchaseSubmitGqlInput!) {
    coursePurchaseSubmit(input: $input) {
      id
      courseId
      status
      paymentMethod
      currency
      amountIrt
      discountAmountIrt
      finalAmountIrt
      couponCode
      uploadedReceiptFileId
      paymentReference
      transactionId
      paymentUrl
      paymentAuthority
      isPurchased
    }
  }
`;
