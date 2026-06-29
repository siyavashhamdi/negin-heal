import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Field, ID, InputType, Int } from "@nestjs/graphql";
import { Types } from "mongoose";

import { ProductReviewVisibility } from "../../../../enums";

import {
  toObjectId,
  toObjectIdOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductReviewSubmitGqlInput {
  @Field(() => ID, { description: "Product ID to review" })
  @IsObjectId({ message: "Product ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  productId: Types.ObjectId;

  @Field(() => Int, {
    nullable: true,
    description: "Optional star rating from 1 to 5",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Stars must be an integer" })
  @Min(1, { message: "Stars must be at least 1" })
  @Max(5, { message: "Stars cannot be greater than 5" })
  stars?: number;

  @Field({
    nullable: true,
    description: "Optional review comment",
  })
  @IsOptional()
  @IsString({ message: "Comment must be a string" })
  @MaxLength(2000, { message: "Comment cannot be longer than 2000 characters" })
  comment?: string;

  @Field({
    nullable: true,
    description: "Captcha challenge identifier issued by the backend",
  })
  @IsOptional()
  @IsString({ message: "Captcha ID must be a string" })
  captchaId?: string;

  @Field({
    nullable: true,
    description: "Captcha answer entered by the user",
  })
  @IsOptional()
  @IsString({ message: "Captcha value must be a string" })
  captchaValue?: string;

  @Field(() => ID, {
    nullable: true,
    description:
      "Review owner user ID; staff only. END_USER accounts always review as themselves",
  })
  @IsOptional()
  @IsObjectId({ message: "User ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectIdOptional)
  userId?: Types.ObjectId;

  @Field(() => ProductReviewVisibility, {
    nullable: true,
    description:
      "Staff only. Visibility for a support message; PUBLIC or PRIVATE",
  })
  @IsOptional()
  @IsEnum(ProductReviewVisibility, {
    message: "Message visibility must be PUBLIC, PRIVATE, or HIDDEN",
  })
  messageVisibility?: ProductReviewVisibility;
}
