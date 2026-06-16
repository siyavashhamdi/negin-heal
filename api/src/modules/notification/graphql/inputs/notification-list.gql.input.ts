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

import { NotificationMode, NotificationSource } from "../../../../enums";
import {
  CursorPageOptionsParamsInput,
  PaginationCursorInput,
} from "../../../../common/pagination/input";
import { NotificationListSortOptionInput } from "./notification-list-sort-option.gql.input";

@InputType()
export class NotificationListFilterInput {
  @Field({
    nullable: true,
    description: "Search query that matches notification title or message",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter notifications by ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Notification ID filter must be a valid Mongo ID" })
  id?: string;

  @Field({ nullable: true, description: "Filter notifications by title" })
  @IsOptional()
  @IsString({ message: "Title filter must be a string" })
  title?: string;

  @Field({ nullable: true, description: "Filter notifications by message" })
  @IsOptional()
  @IsString({ message: "Message filter must be a string" })
  message?: string;

  @Field(() => NotificationSource, {
    nullable: true,
    description: "Filter notifications by domain source",
  })
  @IsOptional()
  @IsEnum(NotificationSource, {
    message: "Source filter must be a valid notification source",
  })
  source?: NotificationSource;

  @Field(() => NotificationMode, {
    nullable: true,
    description: "Filter notifications by visual mode",
  })
  @IsOptional()
  @IsEnum(NotificationMode, {
    message: "Mode filter must be a valid notification mode",
  })
  mode?: NotificationMode;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter by read state",
  })
  @IsOptional()
  @IsBoolean({ message: "isRead filter must be a boolean" })
  isRead?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: "Filter by whether the notification is archived",
  })
  @IsOptional()
  @IsBoolean({ message: "isArchived filter must be a boolean" })
  isArchived?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description:
      "Filter notifications that are currently visible or currently expired",
  })
  @IsOptional()
  @IsBoolean({ message: "isVisible filter must be a boolean" })
  isVisible?: boolean;

  @Field({
    nullable: true,
    description: "Filter notifications created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter notifications created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter notifications updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter notifications updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter notifications read from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Read from filter must be an ISO date" })
  readAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter notifications read until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Read to filter must be an ISO date" })
  readAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter notifications archived from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Archived from filter must be an ISO date" })
  archivedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter notifications archived until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Archived to filter must be an ISO date" })
  archivedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter notifications visible until from this ISO date",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Visible-until from filter must be an ISO date" },
  )
  visibleUntilFrom?: string;

  @Field({
    nullable: true,
    description: "Filter notifications visible until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Visible-until to filter must be an ISO date" })
  visibleUntilTo?: string;
}

@InputType()
export class NotificationListCursorPageOptionsParamsInput extends CursorPageOptionsParamsInput {
  @Field(() => NotificationListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationListSortOptionInput)
  sort?: NotificationListSortOptionInput;
}

@InputType()
export class NotificationListGqlInput extends PaginationCursorInput<NotificationListFilterInput> {
  @Field(() => NotificationListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the notification list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationListFilterInput)
  filters?: NotificationListFilterInput;

  @Field(() => NotificationListCursorPageOptionsParamsInput, {
    nullable: true,
    description: "Cursor pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationListCursorPageOptionsParamsInput)
  options?: NotificationListCursorPageOptionsParamsInput;
}
