import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { CouponDiscountType } from "../../../../enums";

@ObjectType()
export class CouponValidateGqlResponse {
  @Field({ description: "Whether the coupon can be used for this purchase" })
  isValid: boolean;

  @Field({
    nullable: true,
    description: "Human-readable reason when the coupon is invalid",
  })
  message?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Coupon ID when validation succeeds",
  })
  couponId?: Types.ObjectId;

  @Field({ nullable: true, description: "Normalized coupon code" })
  code?: string;

  @Field({ nullable: true, description: "Coupon title" })
  title?: string;

  @Field(() => CouponDiscountType, {
    nullable: true,
    description: "Coupon discount type",
  })
  discountType?: CouponDiscountType;

  @Field(() => Float, {
    nullable: true,
    description: "Coupon discount value",
  })
  discountValue?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Course amount before any discount",
  })
  amountIrt?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Built-in course discount amount",
  })
  courseDiscountAmountIrt?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Amount after built-in course discount and before coupon",
  })
  payableAmountBeforeCouponIrt?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Coupon discount amount",
  })
  couponDiscountAmountIrt?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Final payable amount after coupon",
  })
  finalAmountIrt?: number;
}
