import { Transform } from "class-transformer";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductPaymentDetailGqlInput {
  @Field(() => ID, { description: "User-product purchase record ID" })
  @IsObjectId({
    message: "Payment record ID must be a valid MongoDB ObjectId",
  })
  @Transform(toObjectId)
  id: Types.ObjectId;
}
