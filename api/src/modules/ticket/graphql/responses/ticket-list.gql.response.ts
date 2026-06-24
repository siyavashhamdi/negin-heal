import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import {
  TicketCategory,
  TicketClosedBy,
  TicketPriority,
  TicketStatus,
} from "../../../../enums";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";

@ObjectType()
export class TicketUserProfileMinimalGqlResponse {
  @Field({ nullable: true, description: "User's first name" })
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  lastName?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for the user's avatar",
  })
  avatarAccessUrl?: FileAccessUrlGqlResponse;
}

@ObjectType()
export class TicketUserMinimalGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field({ nullable: true, description: "Username" })
  username?: string;

  @Field(() => TicketUserProfileMinimalGqlResponse, {
    nullable: true,
    description: "User profile information",
  })
  profile?: TicketUserProfileMinimalGqlResponse;
}

@ObjectType()
export class UserTicketSenderProfileGqlResponse {
  @Field({ nullable: true, description: "Sender display first name" })
  firstName?: string;
}

@ObjectType()
export class UserTicketSenderGqlResponse {
  @Field(() => UserTicketSenderProfileGqlResponse, {
    nullable: true,
    description: "Sanitized sender profile information",
  })
  profile?: UserTicketSenderProfileGqlResponse;
}

@ObjectType()
export class TicketStoredFileMinimalGqlResponse {
  @Field({ nullable: true, description: "Stored file name" })
  name?: string;

  @Field({ nullable: true, description: "Stored file MIME type" })
  mimeType?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Stored file size in bytes",
  })
  sizeBytes?: number;

  @Field({ nullable: true, description: "Stored file path" })
  path?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for reading the stored file",
  })
  accessUrl?: FileAccessUrlGqlResponse;
}

@ObjectType()
export class TicketMessageGqlResponse {
  @Field({ description: "Ticket message body" })
  body: string;

  @Field({
    nullable: true,
    description: "Date and time when the message was sent",
  })
  sentAt?: Date;

  @Field(() => TicketUserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal user that sent this message",
  })
  senderUser?: TicketUserMinimalGqlResponse;

  @Field(() => [TicketStoredFileMinimalGqlResponse], {
    description: "Minimal stored file metadata for message attachments",
  })
  attachmentFiles: TicketStoredFileMinimalGqlResponse[];
}

@ObjectType()
export class UserTicketMessageGqlResponse {
  @Field({ description: "Ticket message body" })
  body: string;

  @Field({
    nullable: true,
    description: "Date and time when the message was sent",
  })
  sentAt?: Date;

  @Field(() => UserTicketSenderGqlResponse, {
    nullable: true,
    description: "Sanitized sender information for the current user",
  })
  senderUser?: UserTicketSenderGqlResponse;

  @Field(() => [TicketStoredFileMinimalGqlResponse], {
    description: "Minimal stored file metadata for message attachments",
  })
  attachmentFiles: TicketStoredFileMinimalGqlResponse[];
}

@ObjectType()
export class TicketListUserSummaryProfileGqlResponse {
  @Field({ nullable: true, description: "User's first name" })
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  lastName?: string;
}

@ObjectType()
export class TicketListUserSummaryGqlResponse {
  @Field({ nullable: true, description: "Username" })
  username?: string;

  @Field(() => TicketListUserSummaryProfileGqlResponse, {
    nullable: true,
    description: "User profile information for list display",
  })
  profile?: TicketListUserSummaryProfileGqlResponse;
}

@ObjectType()
export class TicketListSummaryGqlResponse {
  @Field(() => ID, { description: "Ticket ID" })
  id: Types.ObjectId;

  @Field({ description: "Ticket title" })
  title: string;

  @Field(() => TicketCategory, { description: "Ticket category" })
  category: TicketCategory;

  @Field(() => TicketPriority, { description: "Ticket priority" })
  priority: TicketPriority;

  @Field(() => TicketStatus, { description: "Ticket lifecycle status" })
  status: TicketStatus;

  @Field(() => TicketClosedBy, {
    nullable: true,
    description: "Actor type that closed the ticket",
  })
  closedBy?: TicketClosedBy;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that closed the ticket",
  })
  closedByUserId?: Types.ObjectId;

  @Field(() => TicketListUserSummaryGqlResponse, {
    nullable: true,
    description: "Minimal user that closed the ticket",
  })
  closedByUser?: TicketListUserSummaryGqlResponse;

  @Field({ nullable: true, description: "Date when the ticket was closed" })
  closedAt?: Date;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that created the ticket",
  })
  createdByUserId?: Types.ObjectId;

  @Field(() => TicketListUserSummaryGqlResponse, {
    nullable: true,
    description: "Minimal user that created the ticket",
  })
  createdByUser?: TicketListUserSummaryGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that last updated the ticket",
  })
  updatedByUserId?: Types.ObjectId;

  @Field(() => TicketListUserSummaryGqlResponse, {
    nullable: true,
    description: "Minimal user that last updated the ticket",
  })
  updatedByUser?: TicketListUserSummaryGqlResponse;

  @Field(() => Int, { description: "Number of messages in the ticket" })
  messageCount: number;

  @Field({ description: "Body of the most recent message" })
  lastMessageBody: string;

  @Field(() => Int, {
    description: "Total number of attachments across messages",
  })
  attachmentCount: number;

  @Field({ nullable: true, description: "Date when the ticket was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the ticket was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class TicketListGqlResponse {
  @Field(() => ID, { description: "Ticket ID" })
  id: Types.ObjectId;

  @Field({ description: "Ticket title" })
  title: string;

  @Field(() => TicketCategory, { description: "Ticket category" })
  category: TicketCategory;

  @Field(() => TicketPriority, { description: "Ticket priority" })
  priority: TicketPriority;

  @Field(() => TicketStatus, { description: "Ticket lifecycle status" })
  status: TicketStatus;

  @Field(() => TicketClosedBy, {
    nullable: true,
    description: "Actor type that closed the ticket",
  })
  closedBy?: TicketClosedBy;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that closed the ticket",
  })
  closedByUserId?: Types.ObjectId;

  @Field(() => TicketUserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal user that closed the ticket",
  })
  closedByUser?: TicketUserMinimalGqlResponse;

  @Field({ nullable: true, description: "Date when the ticket was closed" })
  closedAt?: Date;

  @Field(() => [TicketMessageGqlResponse], {
    description: "Ticket conversation messages",
  })
  messages: TicketMessageGqlResponse[];

  @Field(() => ID, {
    nullable: true,
    description: "User ID that created the ticket",
  })
  createdByUserId?: Types.ObjectId;

  @Field(() => TicketUserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal user that created the ticket",
  })
  createdByUser?: TicketUserMinimalGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that last updated the ticket",
  })
  updatedByUserId?: Types.ObjectId;

  @Field(() => TicketUserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal user that last updated the ticket",
  })
  updatedByUser?: TicketUserMinimalGqlResponse;

  @Field({ nullable: true, description: "Date when the ticket was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the ticket was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class TicketListPaginatedOffsetGqlResponse {
  @Field(() => [TicketListSummaryGqlResponse], {
    description: "List of support tickets",
  })
  items: TicketListSummaryGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}

@ObjectType()
export class UserTicketListSummaryGqlResponse {
  @Field(() => ID, { description: "Ticket ID" })
  id: Types.ObjectId;

  @Field({ description: "Ticket title" })
  title: string;

  @Field(() => TicketCategory, { description: "Ticket category" })
  category: TicketCategory;

  @Field(() => TicketPriority, { description: "Ticket priority" })
  priority: TicketPriority;

  @Field(() => TicketStatus, { description: "Ticket lifecycle status" })
  status: TicketStatus;

  @Field(() => TicketClosedBy, {
    nullable: true,
    description: "Actor type that closed the ticket",
  })
  closedBy?: TicketClosedBy;

  @Field({ nullable: true, description: "Date when the ticket was closed" })
  closedAt?: Date;

  @Field(() => Int, { description: "Number of messages in the ticket" })
  messageCount: number;

  @Field({ description: "Body of the most recent message" })
  lastMessageBody: string;

  @Field(() => Int, {
    description: "Total number of attachments across messages",
  })
  attachmentCount: number;

  @Field({ nullable: true, description: "Date when the ticket was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the ticket was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class UserTicketListGqlResponse {
  @Field(() => ID, { description: "Ticket ID" })
  id: Types.ObjectId;

  @Field({ description: "Ticket title" })
  title: string;

  @Field(() => TicketCategory, { description: "Ticket category" })
  category: TicketCategory;

  @Field(() => TicketPriority, { description: "Ticket priority" })
  priority: TicketPriority;

  @Field(() => TicketStatus, { description: "Ticket lifecycle status" })
  status: TicketStatus;

  @Field(() => TicketClosedBy, {
    nullable: true,
    description: "Actor type that closed the ticket",
  })
  closedBy?: TicketClosedBy;

  @Field({ nullable: true, description: "Date when the ticket was closed" })
  closedAt?: Date;

  @Field(() => [UserTicketMessageGqlResponse], {
    description: "Ticket conversation messages",
  })
  messages: UserTicketMessageGqlResponse[];

  @Field(() => ID, {
    nullable: true,
    description: "User ID that created the ticket",
  })
  createdByUserId?: Types.ObjectId;

  @Field(() => TicketUserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal user that created the ticket",
  })
  createdByUser?: TicketUserMinimalGqlResponse;

  @Field(() => ID, {
    nullable: true,
    description: "User ID that last updated the ticket",
  })
  updatedByUserId?: Types.ObjectId;

  @Field(() => TicketUserMinimalGqlResponse, {
    nullable: true,
    description: "Minimal user that last updated the ticket",
  })
  updatedByUser?: TicketUserMinimalGqlResponse;

  @Field({ nullable: true, description: "Date when the ticket was created" })
  createdAt?: Date;

  @Field({
    nullable: true,
    description: "Date when the ticket was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class UserTicketListPaginatedOffsetGqlResponse {
  @Field(() => [UserTicketListSummaryGqlResponse], {
    description: "List of current user's support tickets",
  })
  items: UserTicketListSummaryGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
