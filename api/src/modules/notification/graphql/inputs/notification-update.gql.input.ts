import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";

import { NotificationUpdateAction } from "../../../../enums";

@InputType()
export class NotificationUpdateGqlInput {
  @Field(() => [ID], {
    description:
      "Notification IDs to update. Every notification must belong to the current user.",
  })
  @IsArray({ message: "notificationIds must be an array" })
  @ArrayNotEmpty({ message: "notificationIds must contain at least one ID" })
  @ArrayUnique({ message: "notificationIds must not contain duplicate IDs" })
  @IsMongoId({
    each: true,
    message: "Each notification ID must be a valid Mongo ID",
  })
  notificationIds: string[];

  @Field(() => NotificationUpdateAction, {
    description: "Action to apply to the selected notifications",
  })
  @IsEnum(NotificationUpdateAction, {
    message: "Action must be SET_AS_READ, SET_AS_UNREAD, ARCHIVE, or UNARCHIVE",
  })
  action: NotificationUpdateAction;
}
