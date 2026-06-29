import { Types } from "mongoose";
import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";

import { CouponDiscountType } from "../../../../enums";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";

@ObjectType()
export class CouponListSummaryGqlResponse {
  @Field(() => ID, { description: "Coupon ID" })
  id: Types.ObjectId;

  @Field({ description: "Coupon code" })
  code: string;

  @Field({ description: "Coupon display title" })
  title: string;

  @Field(() => CouponDiscountType, {
    description: "Coupon discount type",
  })
  discountType: CouponDiscountType;

  @Field(() => Float, {
    description:
      "Coupon discount value. Percentage or fixed amount based on discountType",
  })
  discountValue: number;

  @Field({ nullable: true, description: "Date when this coupon becomes valid" })
  startsAt?: Date;

  @Field({ nullable: true, description: "Date when this coupon expires" })
  expiresAt?: Date;

  @Field({
    description: "Whether the coupon is restricted to first purchases only",
  })
  isFirstPurchaseOnly: boolean;

  @Field({ description: "Whether this coupon is currently active" })
  isActive: boolean;

  @Field(() => Int, {
    description: "Total committed purchases that used this coupon",
  })
  totalUsageCount: number;

  @Field(() => Int, {
    nullable: true,
    description:
      "Remaining total uses before the total usage limit is reached, if limited",
  })
  remainingTotalUsageCount?: number;

  @Field({ nullable: true, description: "Date when the coupon was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the coupon was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class CouponListGqlResponse {
  @Field(() => ID, { description: "Coupon ID" })
  id: Types.ObjectId;

  @Field({ description: "Coupon code" })
  code: string;

  @Field({ description: "Coupon display title" })
  title: string;

  @Field({ nullable: true, description: "Coupon description" })
  description?: string;

  @Field(() => CouponDiscountType, {
    description: "Coupon discount type",
  })
  discountType: CouponDiscountType;

  @Field(() => Float, {
    description:
      "Coupon discount value. Percentage or fixed amount based on discountType",
  })
  discountValue: number;

  @Field({ nullable: true, description: "Date when this coupon becomes valid" })
  startsAt?: Date;

  @Field({ nullable: true, description: "Date when this coupon expires" })
  expiresAt?: Date;

  @Field(() => Int, {
    nullable: true,
    description: "Maximum total number of uses across all users",
  })
  totalUsageLimit?: number;

  @Field(() => Int, {
    nullable: true,
    description: "Maximum number of uses per user",
  })
  perUserUsageLimit?: number;

  @Field(() => [ID], {
    description: "Product IDs this coupon applies to. Empty means all products",
  })
  applicableProductIds: Types.ObjectId[];

  @Field({
    description: "Whether the coupon is restricted to first purchases only",
  })
  isFirstPurchaseOnly: boolean;

  @Field({ description: "Whether this coupon is currently active" })
  isActive: boolean;

  @Field(() => Int, {
    description: "Total committed purchases that used this coupon",
  })
  totalUsageCount: number;

  @Field(() => Int, {
    nullable: true,
    description:
      "Remaining total uses before the total usage limit is reached, if limited",
  })
  remainingTotalUsageCount?: number;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that created this coupon",
  })
  createdBy?: Types.ObjectId;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that last updated this coupon",
  })
  updatedBy?: Types.ObjectId;

  @Field({ nullable: true, description: "Date when the coupon was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the coupon was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class CouponListPaginatedOffsetGqlResponse {
  @Field(() => [CouponListSummaryGqlResponse], {
    description: "List of coupons",
  })
  items: CouponListSummaryGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
