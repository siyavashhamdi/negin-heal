import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Field, Float, ID, InputType } from "@nestjs/graphql";

import { CouponDiscountType } from "../../../../enums";
import {
  OffsetPageOptionsParamsInput,
  PaginationOffsetInput,
} from "../../../../common/pagination/input";
import { CouponListSortOptionInput } from "./coupon-list-sort-option.gql.input";

@InputType()
export class CouponListFilterInput {
  @Field({
    nullable: true,
    description: "Search query that matches coupon code, title, or description",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter coupons by ID",
  })
  @IsOptional()
  @IsMongoId({ message: "ID filter must be a valid Mongo ID" })
  id?: string;

  @Field({ nullable: true, description: "Filter coupons by code" })
  @IsOptional()
  @IsString({ message: "Code filter must be a string" })
  code?: string;

  @Field({ nullable: true, description: "Filter coupons by title" })
  @IsOptional()
  @IsString({ message: "Title filter must be a string" })
  title?: string;

  @Field(() => CouponDiscountType, {
    nullable: true,
    description: "Filter coupons by discount type",
  })
  @IsOptional()
  @IsEnum(CouponDiscountType, {
    message: "Discount type filter must be valid",
  })
  discountType?: CouponDiscountType;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum discount value",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum discount value filter must be a number" })
  discountValueMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum discount value",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum discount value filter must be a number" })
  discountValueMax?: number;

  @Field({
    nullable: true,
    description: "Filter coupons starting from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Starts from filter must be an ISO date" })
  startsAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter coupons starting until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Starts to filter must be an ISO date" })
  startsAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter coupons expiring from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Expires from filter must be an ISO date" })
  expiresAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter coupons expiring until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Expires to filter must be an ISO date" })
  expiresAtTo?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum total usage limit",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum total usage limit must be a number" })
  totalUsageLimitMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum total usage limit",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum total usage limit must be a number" })
  totalUsageLimitMax?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Minimum per-user usage limit",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Minimum per-user usage limit must be a number" })
  perUserUsageLimitMin?: number;

  @Field(() => Float, {
    nullable: true,
    description: "Maximum per-user usage limit",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Maximum per-user usage limit must be a number" })
  perUserUsageLimitMax?: number;

  @Field(() => ID, {
    nullable: true,
    description: "Filter coupons by applicable product ID",
  })
  @IsOptional()
  @IsMongoId({
    message: "Applicable product ID filter must be a valid Mongo ID",
  })
  applicableProductId?: string;

  @Field({
    nullable: true,
    description: "Filter coupons by first-purchase-only flag",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "First-purchase-only filter must be boolean" })
  isFirstPurchaseOnly?: boolean;

  @Field({ nullable: true, description: "Filter coupons by active status" })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Active status filter must be boolean" })
  isActive?: boolean;

  @Field(() => ID, {
    nullable: true,
    description: "Filter coupons by creator user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Created-by filter must be a valid Mongo ID" })
  createdBy?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter coupons by last updater user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Updated-by filter must be a valid Mongo ID" })
  updatedBy?: string;

  @Field({
    nullable: true,
    description: "Filter coupons created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter coupons created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter coupons updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter coupons updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;
}

@InputType()
export class CouponListOffsetPageOptionsParamsInput extends OffsetPageOptionsParamsInput {
  @Field(() => CouponListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CouponListSortOptionInput)
  sort?: CouponListSortOptionInput;
}

@InputType()
export class CouponListGqlInput extends PaginationOffsetInput<CouponListFilterInput> {
  @Field(() => CouponListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the coupon list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CouponListFilterInput)
  filters?: CouponListFilterInput;

  @Field(() => CouponListOffsetPageOptionsParamsInput, {
    nullable: true,
    description: "Offset pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CouponListOffsetPageOptionsParamsInput)
  options?: CouponListOffsetPageOptionsParamsInput;
}
