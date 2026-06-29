import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserProductPurchaseStatus } from "../../../../enums";
import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class ProductPaymentStatusUpdateGqlInput {
  @Field(() => ID, { description: "User-product purchase record ID" })
  @IsObjectId({ message: "Payment record ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;

  @Field(() => UserProductPurchaseStatus, {
    description: "New purchase status",
  })
  @IsEnum(UserProductPurchaseStatus, {
    message: "Status must be a valid purchase status",
  })
  status: UserProductPurchaseStatus;

  @Field({
    nullable: true,
    description: "Optional manual status-change description",
  })
  @IsOptional()
  @IsString({ message: "Manual status description must be a string" })
  @MaxLength(1000, {
    message: "Manual status description cannot exceed 1000 characters",
  })
  manualStatusChangedDescription?: string;
}
