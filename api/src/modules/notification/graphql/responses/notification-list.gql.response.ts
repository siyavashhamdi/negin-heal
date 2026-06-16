import { Field, GraphQLISODateTime, ID, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import { Types } from "mongoose";

import { NotificationMode, NotificationSource } from "../../../../enums";
import { PaginationCursorResponse } from "../../../../common/pagination/response";

@ObjectType()
export class NotificationListGqlResponse {
  @Field(() => ID, { description: "Notification ID" })
  id: Types.ObjectId;

  @Field(() => ID, {
    nullable: true,
    description: "Target user ID for direct notifications",
  })
  userId?: Types.ObjectId;

  @Field(() => NotificationSource, {
    description: "Domain source that produced this notification",
  })
  source: NotificationSource;

  @Field(() => NotificationMode, {
    description: "Visual mode for this notification",
  })
  mode: NotificationMode;

  @Field({ nullable: true, description: "Notification title" })
  title?: string;

  @Field({ description: "Notification message" })
  message: string;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: "Type-specific payload object",
  })
  payload?: Record<string, unknown>;

  @Field({ description: "Whether the notification has been read" })
  isRead: boolean;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "Date when the notification was read",
  })
  readAt?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "Date when the notification was archived",
  })
  archivedAt?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "Date until this notification should remain visible",
  })
  visibleUntil?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "Date when the notification was created",
  })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "Date when the notification was last updated",
  })
  updatedAt?: Date;
}

@ObjectType()
export class NotificationListPaginatedCursorGqlResponse {
  @Field(() => [NotificationListGqlResponse], {
    description: "List of notifications visible to the current user",
  })
  items: NotificationListGqlResponse[];

  @Field(() => PaginationCursorResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationCursorResponse;
}
