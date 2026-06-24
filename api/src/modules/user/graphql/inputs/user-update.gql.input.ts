import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole, UserStatus } from "../../../../enums";
import { MIN_USERNAME_LENGTH } from "../../../../utils/username-policy.util";
import {
  toObjectId,
  toObjectIdOptional,
} from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";
import {
  IsAuthIdentityMobile,
  IsLatinEmail,
  IsLatinUsername,
} from "../../../../validators/latin-identity.validators";

function toNullableObjectId({
  value,
}: {
  value: unknown;
}): Types.ObjectId | null | unknown {
  if (value === null) {
    return null;
  }

  return toObjectIdOptional({ value });
}

@InputType()
export class UserUpdateProfileGqlInput {
  @Field({ nullable: true, description: "User first name" })
  @IsOptional()
  @IsString({ message: "First name must be a string" })
  firstName?: string | null;

  @Field({ nullable: true, description: "User last name" })
  @IsOptional()
  @IsString({ message: "Last name must be a string" })
  lastName?: string | null;

  @Field({ nullable: true, description: "User email address" })
  @IsOptional()
  @IsString({ message: "Email must be a string" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @IsLatinEmail()
  email?: string | null;

  @Field({ nullable: true, description: "User mobile phone number" })
  @IsOptional()
  @IsString({ message: "Phone number must be a string" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @IsAuthIdentityMobile()
  phoneNumber?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the user's avatar",
  })
  @IsOptional()
  @IsObjectId({ message: "Avatar file ID must be a valid MongoDB ObjectId" })
  @Transform(toNullableObjectId)
  avatarFileId?: Types.ObjectId | null;

  @Field({ nullable: true, description: "User biography" })
  @IsOptional()
  @IsString({ message: "Bio must be a string" })
  bio?: string | null;
}

@InputType()
export class UserUpdatePreferencesGqlInput {
  @Field({ nullable: true, description: "User's preferred language" })
  @IsOptional()
  @IsString({ message: "Language must be a string" })
  language?: string | null;

  @Field({ nullable: true, description: "User's timezone" })
  @IsOptional()
  @IsString({ message: "Timezone must be a string" })
  timezone?: string | null;

  @Field({ nullable: true, description: "Whether notifications are enabled" })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: "notificationsEnabled must be a boolean" })
  notificationsEnabled?: boolean | null;

  @Field({ nullable: true, description: "User's theme preference" })
  @IsOptional()
  @IsString({ message: "Theme must be a string" })
  theme?: string | null;
}

@InputType()
export class UserUpdateGqlInput {
  @Field(() => ID, { description: "User ID" })
  @IsObjectId({ message: "User ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;

  @Field({ nullable: true, description: "Unique username" })
  @IsOptional()
  @IsString({ message: "Username must be a string" })
  @MinLength(MIN_USERNAME_LENGTH, {
    message: `Username must be at least ${MIN_USERNAME_LENGTH} characters long`,
  })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @IsLatinUsername()
  username?: string;

  @Field(() => UserUpdateProfileGqlInput, {
    nullable: true,
    description: "Profile fields to update",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserUpdateProfileGqlInput)
  profile?: UserUpdateProfileGqlInput;

  @Field(() => UserUpdatePreferencesGqlInput, {
    nullable: true,
    description: "Preference fields to update",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserUpdatePreferencesGqlInput)
  preferences?: UserUpdatePreferencesGqlInput;

  @Field(() => [UserRole], {
    nullable: true,
    description: "Roles assigned to the user",
  })
  @IsOptional()
  @IsArray({ message: "Roles must be an array" })
  @ArrayMinSize(1, { message: "At least one role must be assigned" })
  @IsEnum(UserRole, { each: true, message: "Each role must be valid" })
  roles?: UserRole[];

  @Field(() => UserStatus, {
    nullable: true,
    description: "User account status",
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: "Status must be valid" })
  status?: UserStatus;

  @Field({
    nullable: true,
    description: "New password. When provided, active sessions are revoked.",
  })
  @IsOptional()
  @IsString({ message: "Password must be a string" })
  password?: string;
}
