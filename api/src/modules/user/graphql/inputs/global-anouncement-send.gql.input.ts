import { Field, InputType } from "@nestjs/graphql";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import GraphQLJSON from "graphql-type-json";

import { GlobalAnouncementMode } from "../../../../enums";

@InputType()
export class GlobalAnouncementSendGqlInput {
  @Field(() => String, {
    description: "Anouncement title shown to subscribed users",
  })
  @IsString({ message: "Anouncement title must be a string" })
  @IsNotEmpty({ message: "Anouncement title is required" })
  title: string;

  @Field(() => String, {
    description: "Anouncement message shown to subscribed users",
  })
  @IsString({ message: "Anouncement description must be a string" })
  @IsNotEmpty({ message: "Anouncement description is required" })
  description: string;

  @Field(() => GlobalAnouncementMode, {
    defaultValue: GlobalAnouncementMode.INFO,
    nullable: true,
    description: "Popup mode used by clients when displaying the anouncement",
  })
  @IsOptional()
  @IsEnum(GlobalAnouncementMode, {
    message: "Anouncement mode must be valid",
  })
  mode?: GlobalAnouncementMode;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: "Optional extra structured payload for future client actions",
  })
  @IsOptional()
  @IsObject({ message: "Anouncement payload must be an object" })
  payload?: Record<string, unknown>;
}
