import { Transform } from "class-transformer";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class PaymentCouponDeleteGqlInput {
  @Field(() => ID, { description: "Payment coupon ID" })
  @IsObjectId({ message: "Payment coupon ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;
}
