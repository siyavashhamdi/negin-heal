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
  UserCoursePaymentMethod,
  UserCoursePurchaseStatus,
} from "../../../../enums";
import {
  toObjectId,
  toObjectIdOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class CoursePaymentManualCreateGqlInput {
  @Field(() => ID, {
    description: "User ID that will receive the payment record",
  })
  @IsObjectId({ message: "User ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  userId: Types.ObjectId;

  @Field(() => ID, {
    description: "Active paid course ID to register payment for",
  })
  @IsObjectId({ message: "Course ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  courseId: Types.ObjectId;

  @Field(() => UserCoursePaymentMethod, {
    description: "Payment method selected by support for this manual record",
  })
  @IsEnum(UserCoursePaymentMethod, {
    message: "Payment method must be a supported course payment method",
  })
  paymentMethod: UserCoursePaymentMethod;

  @Field(() => UserCoursePurchaseStatus, {
    description: "Initial manual purchase status",
  })
  @IsEnum(UserCoursePurchaseStatus, {
    message: "Status must be a valid purchase status",
  })
  status: UserCoursePurchaseStatus;

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
