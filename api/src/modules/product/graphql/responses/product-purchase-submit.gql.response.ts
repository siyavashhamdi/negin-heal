import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import {
  UserProductPaymentMethod,
  UserProductPurchaseCurrency,
  UserProductPurchaseStatus,
} from "../../../../enums";

@ObjectType()
export class ProductPurchaseSubmitGqlResponse {
  @Field(() => ID, { description: "User product purchase record ID" })
  id: Types.ObjectId;

  @Field(() => ID, { description: "Purchased product ID" })
  productId: Types.ObjectId;

  @Field(() => UserProductPurchaseStatus, {
    description: "Purchase status after submission",
  })
  status: UserProductPurchaseStatus;

  @Field(() => UserProductPaymentMethod, {
    description: "Payment method used for this purchase",
  })
  paymentMethod: UserProductPaymentMethod;

  @Field(() => UserProductPurchaseCurrency, {
    description: "Currency expected for the payment method",
  })
  currency: UserProductPurchaseCurrency;

  @Field(() => Float, { description: "Original product price in IRT" })
  amountIrt: number;

  @Field(() => Float, {
    nullable: true,
    description: "Applied discount amount in IRT",
  })
  discountAmountIrt?: number;

  @Field(() => Float, { description: "Final payable amount in IRT" })
  finalAmountIrt: number;

  @Field({
    nullable: true,
    description: "Applied coupon code, if the purchase used a coupon",
  })
  couponCode?: string;

  @Field({
    nullable: true,
    description: "Receipt number or last source-card digits",
  })
  paymentReference?: string;

  @Field({
    nullable: true,
    description: "Blockchain transaction ID for crypto purchases",
  })
  transactionId?: string;

  @Field({
    nullable: true,
    description: "Gateway redirect URL for online payments",
  })
  paymentUrl?: string;

  @Field({
    nullable: true,
    description: "Gateway authority/reference for online payments",
  })
  paymentAuthority?: string;

  @Field({ description: "Whether this purchase grants product access now" })
  isPurchased: boolean;
}
