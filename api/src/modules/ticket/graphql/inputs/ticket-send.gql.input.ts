import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  ValidateIf,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { TicketCategory, TicketPriority } from "../../../../enums";
import {
  toObjectId,
  toObjectIdArrayOptional,
  toObjectIdOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";

@InputType()
export class TicketSendMessageGqlInput {
  @Field({
    description: "Message body to send with this ticket action",
  })
  @IsString({ message: "Message body must be a string" })
  body: string;

  @Field(() => [ID], {
    nullable: true,
    description: "Attachment stored file IDs for this message",
  })
  @IsOptional()
  @IsArray({ message: "Attachment file IDs must be an array" })
  @IsObjectId({
    each: true,
    message: "Each attachment file ID must be a valid MongoDB ObjectId",
  })
  @Transform(toObjectIdArrayOptional)
  attachmentFileIds?: Types.ObjectId[];
}

@InputType()
export class UserTicketSendGqlInput {
  @Field(() => ID, {
    nullable: true,
    description:
      "Ticket ID for updating an existing ticket. Omit to create a new ticket",
  })
  @IsOptional()
  @IsObjectId({ message: "Ticket ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectIdOptional)
  id?: Types.ObjectId;

  @Field({
    nullable: true,
    description: "Ticket title (required when creating a new ticket)",
  })
  @ValidateIf((input: UserTicketSendGqlInput) => !input.id)
  @IsString({ message: "Ticket title must be a string" })
  title?: string;

  @Field(() => TicketCategory, {
    nullable: true,
    description: "Ticket category (required when creating a new ticket)",
  })
  @ValidateIf((input: UserTicketSendGqlInput) => !input.id)
  @IsEnum(TicketCategory, { message: "Ticket category must be valid" })
  category?: TicketCategory;

  @Field(() => TicketPriority, {
    nullable: true,
    description: "Ticket priority (optional on create and update)",
  })
  @IsOptional()
  @IsEnum(TicketPriority, { message: "Ticket priority must be valid" })
  priority?: TicketPriority;

  @Field(() => TicketSendMessageGqlInput, {
    description: "Message payload to append to ticket conversation",
  })
  @IsObject({ message: "Message payload is required" })
  @ValidateNested()
  @Type(() => TicketSendMessageGqlInput)
  message: TicketSendMessageGqlInput;
}

@InputType()
export class SuperAdminTicketSendGqlInput {
  @Field(() => ID, {
    nullable: true,
    description:
      "Ticket ID for updating an existing ticket. Omit to create a new ticket",
  })
  @IsOptional()
  @IsObjectId({ message: "Ticket ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectIdOptional)
  id?: Types.ObjectId;

  @Field(() => ID, {
    nullable: true,
    description:
      "End-user ID to assign a newly created staff ticket to. Required when creating a new ticket",
  })
  @ValidateIf((input: SuperAdminTicketSendGqlInput) => !input.id)
  @IsObjectId({ message: "End-user ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectIdOptional)
  endUserId?: Types.ObjectId;

  @Field({
    nullable: true,
    description: "Ticket title (required when creating a new ticket)",
  })
  @ValidateIf((input: SuperAdminTicketSendGqlInput) => !input.id)
  @IsString({ message: "Ticket title must be a string" })
  title?: string;

  @Field(() => TicketCategory, {
    nullable: true,
    description: "Ticket category (required when creating a new ticket)",
  })
  @ValidateIf((input: SuperAdminTicketSendGqlInput) => !input.id)
  @IsEnum(TicketCategory, { message: "Ticket category must be valid" })
  category?: TicketCategory;

  @Field(() => TicketPriority, {
    nullable: true,
    description: "Ticket priority (optional on create and update)",
  })
  @IsOptional()
  @IsEnum(TicketPriority, { message: "Ticket priority must be valid" })
  priority?: TicketPriority;

  @Field(() => TicketSendMessageGqlInput, {
    description: "Message payload to append to ticket conversation",
  })
  @IsObject({ message: "Message payload is required" })
  @ValidateNested()
  @Type(() => TicketSendMessageGqlInput)
  message: TicketSendMessageGqlInput;
}
