import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";

import { AppSettingValueType } from "../../../../enums";
import {
  OffsetPageOptionsParamsInput,
  PaginationOffsetInput,
} from "../../../../common/pagination/input";
import { AppSettingKeyListSortOptionInput } from "./app-setting-key-list-sort-option.gql.input";

@InputType()
export class AppSettingKeyListFilterInput {
  @Field({
    nullable: true,
    description: "Search query that matches setting key, label, or description",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter settings by ID",
  })
  @IsOptional()
  @IsMongoId({ message: "ID filter must be a valid Mongo ID" })
  id?: string;

  @Field({
    nullable: true,
    description: "Filter settings by key",
  })
  @IsOptional()
  @IsString({ message: "Key filter must be a string" })
  key?: string;

  @Field({
    nullable: true,
    description: "Filter settings by admin-facing label",
  })
  @IsOptional()
  @IsString({ message: "Label filter must be a string" })
  label?: string;

  @Field(() => AppSettingValueType, {
    nullable: true,
    description: "Filter settings by stored value type",
  })
  @IsOptional()
  @IsEnum(AppSettingValueType, {
    message: "Value type filter must be a valid app setting value type",
  })
  valueType?: AppSettingValueType;

  @Field({
    nullable: true,
    description: "Filter settings by active status",
  })
  @IsOptional()
  @IsBoolean({ message: "Active status filter must be a boolean" })
  isActive?: boolean;

  @Field({
    nullable: true,
    description: "Filter settings created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter settings created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter settings updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter settings updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;
}

@InputType()
export class AppSettingKeyListOffsetPageOptionsParamsInput extends OffsetPageOptionsParamsInput {
  @Field(() => AppSettingKeyListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppSettingKeyListSortOptionInput)
  sort?: AppSettingKeyListSortOptionInput;
}

@InputType()
export class AppSettingKeyListGqlInput extends PaginationOffsetInput<AppSettingKeyListFilterInput> {
  @Field(() => AppSettingKeyListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down app setting keys",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppSettingKeyListFilterInput)
  filters?: AppSettingKeyListFilterInput;

  @Field(() => AppSettingKeyListOffsetPageOptionsParamsInput, {
    nullable: true,
    description: "Offset pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppSettingKeyListOffsetPageOptionsParamsInput)
  options?: AppSettingKeyListOffsetPageOptionsParamsInput;
}
