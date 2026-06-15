import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";

import {
  TicketCategory,
  TicketClosedBy,
  TicketPriority,
  TicketStatus,
} from "../../../../enums";
import {
  OffsetPageOptionsParamsInput,
  PaginationOffsetInput,
} from "../../../../common/pagination/input";
import { TicketListSortOptionInput } from "./ticket-list-sort-option.gql.input";

@InputType()
export class TicketListFilterInput {
  @Field({
    nullable: true,
    description: "Search query that matches ticket title or message body",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, { nullable: true, description: "Filter tickets by ID" })
  @IsOptional()
  @IsMongoId({ message: "Ticket ID filter must be a valid Mongo ID" })
  id?: string;

  @Field({ nullable: true, description: "Filter tickets by title" })
  @IsOptional()
  @IsString({ message: "Title filter must be a string" })
  title?: string;

  @Field({ nullable: true, description: "Filter tickets by message body" })
  @IsOptional()
  @IsString({ message: "Message body filter must be a string" })
  messageBody?: string;

  @Field(() => TicketCategory, {
    nullable: true,
    description: "Filter tickets by category",
  })
  @IsOptional()
  @IsEnum(TicketCategory, { message: "Category filter must be valid" })
  category?: TicketCategory;

  @Field(() => TicketPriority, {
    nullable: true,
    description: "Filter tickets by priority",
  })
  @IsOptional()
  @IsEnum(TicketPriority, { message: "Priority filter must be valid" })
  priority?: TicketPriority;

  @Field(() => TicketStatus, {
    nullable: true,
    description: "Filter tickets by status",
  })
  @IsOptional()
  @IsEnum(TicketStatus, { message: "Status filter must be valid" })
  status?: TicketStatus;

  @Field(() => TicketClosedBy, {
    nullable: true,
    description: "Filter tickets by close actor type",
  })
  @IsOptional()
  @IsEnum(TicketClosedBy, { message: "Closed-by filter must be valid" })
  closedBy?: TicketClosedBy;

  @Field(() => ID, {
    nullable: true,
    description: "Filter tickets by creator user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Creator user ID filter must be a valid Mongo ID" })
  createdByUserId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter tickets by last updater user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Updater user ID filter must be a valid Mongo ID" })
  updatedByUserId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter tickets by closer user ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Closer user ID filter must be a valid Mongo ID" })
  closedByUserId?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter tickets containing this attachment file ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Attachment file ID filter must be a valid Mongo ID" })
  attachmentFileId?: string;

  @Field({
    nullable: true,
    description: "Filter tickets created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter tickets created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter tickets updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter tickets updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter tickets closed from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Closed from filter must be an ISO date" })
  closedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter tickets closed until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Closed to filter must be an ISO date" })
  closedAtTo?: string;
}

@InputType()
export class TicketListOffsetPageOptionsParamsInput extends OffsetPageOptionsParamsInput {
  @Field(() => TicketListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TicketListSortOptionInput)
  sort?: TicketListSortOptionInput;
}

@InputType()
export class TicketListGqlInput extends PaginationOffsetInput<TicketListFilterInput> {
  @Field(() => TicketListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the ticket list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TicketListFilterInput)
  filters?: TicketListFilterInput;

  @Field(() => TicketListOffsetPageOptionsParamsInput, {
    nullable: true,
    description: "Offset pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TicketListOffsetPageOptionsParamsInput)
  options?: TicketListOffsetPageOptionsParamsInput;
}

@InputType()
export class UserTicketListFilterInput {
  @Field({
    nullable: true,
    description: "Search query that matches ticket title or message body",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, { nullable: true, description: "Filter tickets by ID" })
  @IsOptional()
  @IsMongoId({ message: "Ticket ID filter must be a valid Mongo ID" })
  id?: string;

  @Field({ nullable: true, description: "Filter tickets by title" })
  @IsOptional()
  @IsString({ message: "Title filter must be a string" })
  title?: string;

  @Field({ nullable: true, description: "Filter tickets by message body" })
  @IsOptional()
  @IsString({ message: "Message body filter must be a string" })
  messageBody?: string;

  @Field(() => TicketCategory, {
    nullable: true,
    description: "Filter tickets by category",
  })
  @IsOptional()
  @IsEnum(TicketCategory, { message: "Category filter must be valid" })
  category?: TicketCategory;

  @Field(() => TicketPriority, {
    nullable: true,
    description: "Filter tickets by priority",
  })
  @IsOptional()
  @IsEnum(TicketPriority, { message: "Priority filter must be valid" })
  priority?: TicketPriority;

  @Field(() => TicketStatus, {
    nullable: true,
    description: "Filter tickets by status",
  })
  @IsOptional()
  @IsEnum(TicketStatus, { message: "Status filter must be valid" })
  status?: TicketStatus;

  @Field(() => TicketClosedBy, {
    nullable: true,
    description: "Filter tickets by close actor type",
  })
  @IsOptional()
  @IsEnum(TicketClosedBy, { message: "Closed-by filter must be valid" })
  closedBy?: TicketClosedBy;

  @Field(() => ID, {
    nullable: true,
    description: "Filter tickets containing this attachment file ID",
  })
  @IsOptional()
  @IsMongoId({ message: "Attachment file ID filter must be a valid Mongo ID" })
  attachmentFileId?: string;

  @Field({
    nullable: true,
    description: "Filter tickets created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter tickets created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter tickets updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter tickets updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter tickets closed from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Closed from filter must be an ISO date" })
  closedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter tickets closed until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Closed to filter must be an ISO date" })
  closedAtTo?: string;
}

@InputType()
export class UserTicketListGqlInput extends PaginationOffsetInput<UserTicketListFilterInput> {
  @Field(() => UserTicketListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the current user's tickets",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserTicketListFilterInput)
  filters?: UserTicketListFilterInput;

  @Field(() => TicketListOffsetPageOptionsParamsInput, {
    nullable: true,
    description: "Offset pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TicketListOffsetPageOptionsParamsInput)
  options?: TicketListOffsetPageOptionsParamsInput;
}
