import { IsOptional, IsString } from "class-validator";
import { Field, InputType, OmitType } from "@nestjs/graphql";

import { UserUpdateGqlInput } from "./user-update.gql.input";

@InputType()
export class UserProfileUpdateGqlInput extends OmitType(
  UserUpdateGqlInput,
  ["id", "roles", "status"] as const,
  InputType,
) {
  @Field({
    nullable: true,
    description: "Current account password. Required when changing password.",
  })
  @IsOptional()
  @IsString({ message: "Current password must be a string" })
  currentPassword?: string | null;
}
