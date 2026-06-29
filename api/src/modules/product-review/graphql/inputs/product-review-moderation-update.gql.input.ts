import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import {
  ProductReviewModerationTarget,
  ProductReviewVisibility,
} from "../../../../enums";
import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductReviewModerationUpdateGqlInput {
  @Field(() => ID, { description: "Product review ID" })
  @IsObjectId({ message: "Review ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  reviewId: Types.ObjectId;

  @Field(() => ProductReviewModerationTarget, {
    description:
      "Which moderation scope to update: review thread, rating, or message",
  })
  @IsEnum(ProductReviewModerationTarget, {
    message: "Moderation target must be REVIEW, RATING, or MESSAGE",
  })
  target: ProductReviewModerationTarget;

  @Field(() => ProductReviewVisibility, {
    description: "New moderation visibility",
  })
  @IsEnum(ProductReviewVisibility, {
    message: "Visibility must be PUBLIC, PRIVATE, or HIDDEN",
  })
  visibility: ProductReviewVisibility;

  @Field({
    nullable: true,
    description: "Stable message key; required when target is MESSAGE",
  })
  @IsOptional()
  @IsString({ message: "Message key must be a string" })
  messageKey?: string;

  @Field({
    nullable: true,
    description: "Optional internal note when hiding content",
  })
  @IsOptional()
  @IsString({ message: "Hidden reason must be a string" })
  @MaxLength(500, {
    message: "Hidden reason cannot be longer than 500 characters",
  })
  hiddenReason?: string;
}
