import { Types } from "mongoose";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { AppSettingValueType } from "../../../../enums";
import GraphQLJSON from "graphql-type-json";

@ObjectType()
export class AppSettingMutationGqlResponse {
  @Field(() => ID, { description: "App setting ID" })
  id: Types.ObjectId;

  @Field({ description: "Unique app setting key" })
  key: string;

  @Field({ description: "Admin-facing app setting label" })
  label: string;

  @Field(() => AppSettingValueType, {
    description: "Stored value type for this app setting",
  })
  valueType: AppSettingValueType;

  @Field(() => GraphQLJSON, {
    description: "Stored app setting value",
  })
  value: unknown;

  @Field({
    nullable: true,
    description: "Admin-facing app setting description",
  })
  description?: string;

  @Field({ description: "Whether this app setting is currently active" })
  isActive: boolean;

  @Field({
    nullable: true,
    description: "Date when the app setting was created",
  })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the app setting was last updated",
  })
  updatedAt?: Date;
}
