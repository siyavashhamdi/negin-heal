import { Transform } from "class-transformer";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductDeleteGqlInput {
  @Field(() => ID, { description: "Product ID" })
  @IsObjectId({ message: "Product ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;
}
