import { Field, InputType } from "@nestjs/graphql";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import GraphQLJSON from "graphql-type-json";

import { GeneralAnouncementMode } from "../../../../enums";

@InputType()
export class GeneralAnouncementSendGqlInput {
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

  @Field(() => GeneralAnouncementMode, {
    defaultValue: GeneralAnouncementMode.INFO,
    nullable: true,
    description: "Popup mode used by clients when displaying the anouncement",
  })
  @IsOptional()
  @IsEnum(GeneralAnouncementMode, {
    message: "Anouncement mode must be valid",
  })
  mode?: GeneralAnouncementMode;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: "Optional extra structured payload for future client actions",
  })
  @IsOptional()
  @IsObject({ message: "Anouncement payload must be an object" })
  payload?: Record<string, unknown>;
}
