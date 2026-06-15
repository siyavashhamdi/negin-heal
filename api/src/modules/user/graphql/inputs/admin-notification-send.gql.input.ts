import { Field, InputType } from "@nestjs/graphql";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import GraphQLJSON from "graphql-type-json";

import { AdminNotificationMode } from "../../../../enums";

@InputType()
export class AdminNotificationSendGqlInput {
  @Field(() => String, {
    description: "Notification title shown to subscribed users",
  })
  @IsString({ message: "Notification title must be a string" })
  @IsNotEmpty({ message: "Notification title is required" })
  title: string;

  @Field(() => String, {
    description: "Notification message shown to subscribed users",
  })
  @IsString({ message: "Notification description must be a string" })
  @IsNotEmpty({ message: "Notification description is required" })
  description: string;

  @Field(() => AdminNotificationMode, {
    defaultValue: AdminNotificationMode.INFO,
    nullable: true,
    description: "Popup mode used by clients when displaying the notification",
  })
  @IsOptional()
  @IsEnum(AdminNotificationMode, {
    message: "Notification mode must be valid",
  })
  mode?: AdminNotificationMode;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: "Optional extra structured payload for future client actions",
  })
  @IsOptional()
  @IsObject({ message: "Notification payload must be an object" })
  payload?: Record<string, unknown>;
}
