import { Transform } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import {
  UserProductPaymentMethod,
  UserProductPurchaseStatus,
} from "../../../../enums";
import {
  toObjectId,
  toObjectIdOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductPaymentManualCreateGqlInput {
  @Field(() => ID, {
    description: "User ID that will receive the payment record",
  })
  @IsObjectId({ message: "User ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  userId: Types.ObjectId;

  @Field(() => ID, {
    description: "Active paid product ID to register payment for",
  })
  @IsObjectId({ message: "Product ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  productId: Types.ObjectId;

  @Field(() => UserProductPaymentMethod, {
    description: "Payment method selected by support for this manual record",
  })
  @IsEnum(UserProductPaymentMethod, {
    message: "Payment method must be a supported product payment method",
  })
  paymentMethod: UserProductPaymentMethod;

  @Field(() => UserProductPurchaseStatus, {
    description: "Initial manual purchase status",
  })
  @IsEnum(UserProductPurchaseStatus, {
    message: "Status must be a valid purchase status",
  })
  status: UserProductPurchaseStatus;

  @Field({
    nullable: true,
    description: "Optional coupon code to apply to this manual payment",
  })
  @IsOptional()
  @IsString({ message: "Coupon code must be a string" })
  @IsNotEmpty({ message: "Coupon code cannot be empty" })
  @MaxLength(64, { message: "Coupon code cannot be longer than 64 characters" })
  couponCode?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Optional uploaded payment evidence file ID",
  })
  @IsOptional()
  @IsObjectId({
    message: "Payment evidence file ID must be a valid MongoDB ObjectId",
  })
  @Transform(toObjectIdOptional)
  uploadedReceiptFileId?: Types.ObjectId;

  @Field({
    nullable: true,
    description: "Optional manual review description",
  })
  @IsOptional()
  @IsString({ message: "Manual review description must be a string" })
  @MaxLength(1000, {
    message: "Manual review description cannot exceed 1000 characters",
  })
  manualStatusChangedDescription?: string;
}
