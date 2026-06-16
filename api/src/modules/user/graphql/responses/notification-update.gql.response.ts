import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

import { NotificationUpdateAction } from "../../../../enums";
import { NotificationListGqlResponse } from "./notification-list.gql.response";

@ObjectType()
export class NotificationUpdateGqlResponse {
  @Field(() => NotificationUpdateAction, {
    description: "Action applied to the selected notifications",
  })
  action: NotificationUpdateAction;

  @Field(() => [ID], {
    description: "Notification IDs requested for update",
  })
  notificationIds: string[];

  @Field(() => Int, {
    description: "Number of unique notification IDs requested",
  })
  requestedCount: number;

  @Field(() => Int, {
    description: "Number of current-user notifications matched",
  })
  matchedCount: number;

  @Field(() => Int, {
    description: "Number of notification documents modified by this operation",
  })
  modifiedCount: number;

  @Field(() => [NotificationListGqlResponse], {
    description: "Updated notification records",
  })
  items: NotificationListGqlResponse[];
}
