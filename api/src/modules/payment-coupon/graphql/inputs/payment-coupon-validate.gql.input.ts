import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class PaymentCouponValidateGqlInput {
  @Field(() => ID, { description: "Course ID" })
  @IsObjectId({ message: "Course ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  courseId: Types.ObjectId;

  @Field({ description: "Coupon code" })
  @IsString({ message: "Coupon code must be a string" })
  @IsNotEmpty({ message: "Coupon code is required" })
  @MaxLength(64, { message: "Coupon code cannot be longer than 64 characters" })
  code: string;
}
