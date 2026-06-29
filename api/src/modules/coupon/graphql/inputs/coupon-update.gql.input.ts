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
import {
  toObjectId,
  toObjectIdArrayOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

function toNullableObjectIdArray({
  value,
}: {
  value: unknown;
}): Types.ObjectId[] | null | undefined | unknown {
  if (value === null) {
    return null;
  }

  return toObjectIdArrayOptional({ value });
}

@InputType()
export class CouponUpdateGqlInput {
  @Field(() => ID, { description: "Coupon ID" })
  @IsObjectId({ message: "Coupon ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;

  @Field({ nullable: true, description: "Unique coupon code" })
  @IsOptional()
  @IsString({ message: "Coupon code must be a string" })
  code?: string;

  @Field({ nullable: true, description: "Coupon display title" })
  @IsOptional()
  @IsString({ message: "Coupon title must be a string" })
  title?: string;

  @Field({ nullable: true, description: "Coupon description" })
  @IsOptional()
  @IsString({ message: "Coupon description must be a string" })
  description?: string | null;

  @Field(() => CouponDiscountType, {
    nullable: true,
    description: "Coupon discount type",
  })
  @IsOptional()
  @IsEnum(CouponDiscountType, {
    message: "Discount type must be PERCENTAGE or FIXED_AMOUNT",
  })
  discountType?: CouponDiscountType;

  @Field(() => Float, {
    nullable: true,
    description:
      "Coupon discount value. Percentage or fixed amount based on discountType",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Discount value must be a number" })
  @Min(0)
  discountValue?: number;

  @Field({
    nullable: true,
    description: "Date when this coupon becomes valid. Use null to clear it",
  })
  @IsOptional()
  @IsDateString({}, { message: "Starts at must be an ISO date" })
  startsAt?: string | null;

  @Field({
    nullable: true,
    description: "Date when this coupon expires. Use null to clear it",
  })
  @IsOptional()
  @IsDateString({}, { message: "Expires at must be an ISO date" })
  expiresAt?: string | null;

  @Field(() => Int, {
    nullable: true,
    description:
      "Maximum total number of uses across all users. Use null to clear it",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Total usage limit must be an integer" })
  @Min(1)
  totalUsageLimit?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: "Maximum number of uses per user. Use null to clear it",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Per-user usage limit must be an integer" })
  @Min(1)
  perUserUsageLimit?: number | null;

  @Field(() => [ID], {
    nullable: true,
    description:
      "Product IDs this coupon applies to. Empty array or null means all products",
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
  @Transform(toNullableObjectIdArray)
  applicableProductIds?: Types.ObjectId[] | null;

  @Field(() => Boolean, {
    nullable: true,
    description: "Whether the coupon is restricted to first purchases only",
  })
  @IsOptional()
  @IsBoolean({ message: "First-purchase-only flag must be boolean" })
  isFirstPurchaseOnly?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: "Whether this coupon is currently active",
  })
  @IsOptional()
  @IsBoolean({ message: "Active status must be boolean" })
  isActive?: boolean;
}
