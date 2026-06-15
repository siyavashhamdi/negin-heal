import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { AppSettingValueType } from "../../../../enums";
import GraphQLJSON from "graphql-type-json";
import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class AppSettingUpdateGqlInput {
  @Field(() => ID, { description: "App setting ID" })
  @IsObjectId({ message: "App setting ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;

  @Field({
    nullable: true,
    description: "Admin-facing app setting label",
  })
  @IsOptional()
  @IsString({ message: "Label must be a string" })
  label?: string;

  @Field({
    nullable: true,
    description:
      "Admin-facing app setting description. Pass null to remove the description.",
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: "Description must be a string" })
  description?: string | null;

  @Field(() => AppSettingValueType, {
    nullable: true,
    description:
      "Stored value type. When changed, a compatible value must also be provided.",
  })
  @IsOptional()
  @IsEnum(AppSettingValueType, {
    message: "Value type must be a valid app setting value type",
  })
  valueType?: AppSettingValueType;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description:
      "Stored app setting value. Must match the effective value type of the setting.",
  })
  @IsOptional()
  value?: unknown;

  @Field({
    nullable: true,
    description: "Whether this app setting is currently active",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "Active status must be a boolean" })
  isActive?: boolean;
}
