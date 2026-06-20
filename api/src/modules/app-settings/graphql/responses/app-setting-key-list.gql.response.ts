import { Types } from "mongoose";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { AppSettingValueType } from "../../../../enums";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";

@ObjectType()
export class AppSettingKeyListSummaryGqlResponse {
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

@ObjectType()
export class AppSettingKeyListPaginatedOffsetGqlResponse {
  @Field(() => [AppSettingKeyListSummaryGqlResponse], {
    description: "List of app setting keys",
  })
  items: AppSettingKeyListSummaryGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
