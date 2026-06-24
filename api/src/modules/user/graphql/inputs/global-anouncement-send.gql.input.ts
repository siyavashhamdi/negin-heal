import { Field, InputType } from "@nestjs/graphql";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import GraphQLJSON from "graphql-type-json";

import {
  GlobalAnouncementMessageType,
  NotificationMode,
} from "../../../../enums";

@InputType()
export class GlobalAnouncementSendGqlInput {
  @Field(() => String, {
    nullable: true,
    description: "Anouncement title shown to subscribed users",
  })
  @ValidateIf(
    (input: GlobalAnouncementSendGqlInput) =>
      input.messageType === GlobalAnouncementMessageType.POPUP ||
      input.title !== undefined,
  )
  @IsString({ message: "Anouncement title must be a string" })
  @ValidateIf(
    (input: GlobalAnouncementSendGqlInput) =>
      input.messageType === GlobalAnouncementMessageType.POPUP,
  )
  @IsNotEmpty({ message: "Anouncement title is required for popup messages" })
  title?: string;

  @Field(() => String, {
    description: "Anouncement message shown to subscribed users",
  })
  @IsString({ message: "Anouncement description must be a string" })
  @IsNotEmpty({ message: "Anouncement description is required" })
  description: string;

  @Field(() => NotificationMode, {
    defaultValue: NotificationMode.INFO,
    nullable: true,
    description: "Popup mode used by clients when displaying the anouncement",
  })
  @IsOptional()
  @IsEnum(NotificationMode, {
    message: "Anouncement mode must be valid",
  })
  mode?: NotificationMode;

  @Field(() => GlobalAnouncementMessageType, {
    defaultValue: GlobalAnouncementMessageType.POPUP,
    nullable: true,
    description: "Target message renderer on clients (popup or snackbar)",
  })
  @IsOptional()
  @IsEnum(GlobalAnouncementMessageType, {
    message: "Anouncement message type must be valid",
  })
  messageType?: GlobalAnouncementMessageType;

  @Field(() => Boolean, {
    defaultValue: false,
    nullable: true,
    description:
      "Whether this notification should also be pushed through native push channel",
  })
  @IsOptional()
  @IsBoolean({ message: "isPushNotification must be a boolean" })
  isPushNotification?: boolean;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: "Optional extra structured payload for future client actions",
  })
  @IsOptional()
  @IsObject({ message: "Anouncement payload must be an object" })
  payload?: Record<string, unknown>;
}
