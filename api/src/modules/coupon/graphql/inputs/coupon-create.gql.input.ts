import { Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Field, Float, ID, InputType, Int } from "@nestjs/graphql";
import { Types } from "mongoose";

import { CouponDiscountType } from "../../../../enums";
import { toObjectIdArrayOptional } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class CouponCreateGqlInput {
  @Field({ description: "Unique coupon code" })
  @IsString({ message: "Coupon code must be a string" })
  code: string;

  @Field({ description: "Coupon display title" })
  @IsString({ message: "Coupon title must be a string" })
  title: string;

  @Field({ nullable: true, description: "Coupon description" })
  @IsOptional()
  @IsString({ message: "Coupon description must be a string" })
  description?: string;

  @Field(() => CouponDiscountType, {
    description: "Coupon discount type",
  })
  @IsEnum(CouponDiscountType, {
    message: "Discount type must be PERCENTAGE or FIXED_AMOUNT",
  })
  discountType: CouponDiscountType;

  @Field(() => Float, {
    description:
      "Coupon discount value. Percentage or fixed amount based on discountType",
  })
  @Type(() => Number)
  @IsNumber({}, { message: "Discount value must be a number" })
  @Min(0)
  discountValue: number;

  @Field({
    nullable: true,
    description: "Date when this coupon becomes valid",
  })
  @IsOptional()
  @IsDateString({}, { message: "Starts at must be an ISO date" })
  startsAt?: string;

  @Field({
    nullable: true,
    description: "Date when this coupon expires",
  })
  @IsOptional()
  @IsDateString({}, { message: "Expires at must be an ISO date" })
  expiresAt?: string;

  @Field(() => Int, {
    nullable: true,
    description: "Maximum total number of uses across all users",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Total usage limit must be an integer" })
  @Min(1)
  totalUsageLimit?: number;

  @Field(() => Int, {
    nullable: true,
    description: "Maximum number of uses per user",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Per-user usage limit must be an integer" })
  @Min(1)
  perUserUsageLimit?: number;

  @Field(() => [ID], {
    nullable: true,
    description: "Product IDs this coupon applies to. Empty means all products",
  })
  @IsOptional()
  @IsArray({ message: "Applicable product IDs must be an array" })
  @ArrayUnique((productId: Types.ObjectId) => productId.toString(), {
    message: "Applicable product IDs must be unique",
  })
  @IsObjectId({
    each: true,
    message: "Each applicable product ID must be a valid MongoDB ObjectId",
  })
  @Transform(toObjectIdArrayOptional)
  applicableProductIds?: Types.ObjectId[];

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: "Whether the coupon is restricted to first purchases only",
  })
  @IsOptional()
  @IsBoolean({ message: "First-purchase-only flag must be boolean" })
  isFirstPurchaseOnly?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: true,
    description: "Whether this coupon is currently active",
  })
  @IsOptional()
  @IsBoolean({ message: "Active status must be boolean" })
  isActive?: boolean;
}
