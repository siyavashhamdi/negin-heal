import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductChapterCompleteGqlInput {
  @Field(() => ID, { description: "Product ID containing the chapter" })
  @IsObjectId({ message: "Product ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  productId: Types.ObjectId;

  @Field({ description: "Stable chapter key to mark as completed" })
  @IsString({ message: "Chapter key must be a string" })
  @IsNotEmpty({ message: "Chapter key cannot be empty" })
  @MaxLength(128, {
    message: "Chapter key cannot be longer than 128 characters",
  })
  chapterKey: string;
}
