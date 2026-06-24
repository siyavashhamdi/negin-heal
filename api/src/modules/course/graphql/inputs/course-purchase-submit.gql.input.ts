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

import { UserCoursePaymentMethod } from "../../../../enums";
import {
  toObjectId,
  toObjectIdOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class CoursePurchaseSubmitGqlInput {
  @Field(() => ID, { description: "Course ID to purchase" })
  @IsObjectId({ message: "Course ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  courseId: Types.ObjectId;

  @Field(() => UserCoursePaymentMethod, {
    description:
      "Payment method. Supports GATEWAY, CARD_TO_CARD, CRYPTOCURRENCY, and FREE.",
  })
  @IsEnum(UserCoursePaymentMethod, {
    message: "Payment method must be a supported course payment method",
  })
  paymentMethod: UserCoursePaymentMethod;

  @Field({
    nullable: true,
    description: "Optional coupon code to apply to this purchase",
  })
  @IsOptional()
  @IsString({ message: "Coupon code must be a string" })
  @IsNotEmpty({ message: "Coupon code cannot be empty" })
  @MaxLength(64, { message: "Coupon code cannot be longer than 64 characters" })
  couponCode?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      "Uploaded receipt file ID. Required for CARD_TO_CARD when paymentReference is omitted.",
  })
  @IsOptional()
  @IsObjectId({ message: "Receipt file ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectIdOptional)
  uploadedReceiptFileId?: Types.ObjectId;

  @Field({
    nullable: true,
    description:
      "Receipt number or last card digits. Required for CARD_TO_CARD when uploadedReceiptFileId is omitted.",
  })
  @IsOptional()
  @IsString({ message: "Payment reference must be a string" })
  @IsNotEmpty({ message: "Payment reference cannot be empty" })
  @MaxLength(128, {
    message: "Payment reference cannot be longer than 128 characters",
  })
  paymentReference?: string;

  @Field({
    nullable: true,
    description: "Blockchain transaction ID. Required for CRYPTOCURRENCY.",
  })
  @IsOptional()
  @IsString({ message: "Transaction ID must be a string" })
  @IsNotEmpty({ message: "Transaction ID cannot be empty" })
  @MaxLength(256, {
    message: "Transaction ID cannot be longer than 256 characters",
  })
  transactionId?: string;
}
