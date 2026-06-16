import { IsEnum, IsOptional } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { SortingOrder } from "../../../../common/pagination/input";

@InputType()
export class CouponListSortOptionInput {
  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by creation date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  createdAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by last update date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  updatedAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by coupon code",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  code?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by coupon title",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  title?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by discount type",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  discountType?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by discount value",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  discountValue?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by coupon start date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  startsAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by coupon expiration date",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  expiresAt?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by total usage limit",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  totalUsageLimit?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by per-user usage limit",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  perUserUsageLimit?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by first-purchase-only flag",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  isFirstPurchaseOnly?: SortingOrder;

  @Field(() => SortingOrder, {
    nullable: true,
    description: "Sort by active state",
  })
  @IsOptional()
  @IsEnum(SortingOrder, { message: "Sort order must be ASC or DESC" })
  isActive?: SortingOrder;
}
