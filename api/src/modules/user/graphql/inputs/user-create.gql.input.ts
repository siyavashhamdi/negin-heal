import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { UserRole, UserStatus } from "../../../../enums";
import { MIN_USERNAME_LENGTH } from "../../../../utils/username-policy.util";
import { UserUpdateProfileGqlInput } from "./user-update.gql.input";
import { IsLatinUsername } from "../../../../validators/latin-identity.validators";

@InputType()
export class UserCreateGqlInput {
  @Field({ description: "Unique username" })
  @IsString({ message: "Username must be a string" })
  @MinLength(MIN_USERNAME_LENGTH, {
    message: `Username must be at least ${MIN_USERNAME_LENGTH} characters long`,
  })
  @IsLatinUsername()
  username: string;

  @Field({ description: "Initial account password" })
  @IsString({ message: "Password must be a string" })
  password: string;

  @Field(() => UserUpdateProfileGqlInput, {
    nullable: true,
    description: "Optional profile fields for the new user",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserUpdateProfileGqlInput)
  profile?: UserUpdateProfileGqlInput;

  @Field(() => [UserRole], {
    description: "Roles assigned to the user",
  })
  @IsArray({ message: "Roles must be an array" })
  @ArrayMinSize(1, { message: "At least one role must be assigned" })
  @IsEnum(UserRole, { each: true, message: "Each role must be valid" })
  roles: UserRole[];

  @Field(() => UserStatus, {
    nullable: true,
    defaultValue: UserStatus.ACTIVE,
    description: "Initial user account status",
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: "Status must be valid" })
  status?: UserStatus;
}
