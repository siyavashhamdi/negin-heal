import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";

import { UserRole, UserStatus } from "../../../../enums";
import {
  OffsetPageOptionsParamsInput,
  PaginationOffsetInput,
} from "../../../../common/pagination/input";
import { UserListSortOptionInput } from "./user-list-sort-option.gql.input";
import {
  LATIN_EMAIL_CHARSET_REGEX,
  LATIN_USERNAME_REGEX,
} from "../../../../utils/latin-identity.util";

@InputType()
export class UserListFilterInput {
  @Field({
    nullable: true,
    description:
      "Search query that matches username, first name, last name, email, or phone number",
  })
  @IsOptional()
  @IsString({ message: "Query filter must be a string" })
  query?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Filter users by ID",
  })
  @IsOptional()
  @IsMongoId({ message: "ID filter must be a valid Mongo ID" })
  id?: string;

  @Field({
    nullable: true,
    description: "Filter users by username",
  })
  @IsOptional()
  @IsString({ message: "Username filter must be a string" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @Matches(LATIN_USERNAME_REGEX, {
    message:
      "Username filter may only contain English letters, numbers, dots, underscores, and hyphens",
  })
  username?: string;

  @Field({
    nullable: true,
    description: "Filter users by first name",
  })
  @IsOptional()
  @IsString({ message: "First name filter must be a string" })
  firstName?: string;

  @Field({
    nullable: true,
    description: "Filter users by last name",
  })
  @IsOptional()
  @IsString({ message: "Last name filter must be a string" })
  lastName?: string;

  @Field({
    nullable: true,
    description: "Filter users by first name or last name",
  })
  @IsOptional()
  @IsString({ message: "Full name filter must be a string" })
  fullName?: string;

  @Field({
    nullable: true,
    description: "Filter users by email",
  })
  @IsOptional()
  @IsString({ message: "Email filter must be a string" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @Matches(LATIN_EMAIL_CHARSET_REGEX, {
    message:
      "Email filter may only contain English letters, numbers, and email symbols",
  })
  email?: string;

  @Field({
    nullable: true,
    description: "Filter users by phone number",
  })
  @IsOptional()
  @IsString({ message: "Phone number filter must be a string" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @Matches(/^[0-9+]+$/, {
    message: "Phone number filter may only contain digits and +",
  })
  phoneNumber?: string;

  @Field({
    nullable: true,
    description: "Filter users by mobile phone number",
  })
  @IsOptional()
  @IsString({ message: "Mobile phone filter must be a string" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @Matches(/^[0-9+]+$/, {
    message: "Mobile phone filter may only contain digits and +",
  })
  mobilePhone?: string;

  @Field(() => UserRole, {
    nullable: true,
    description: "Filter users by role",
  })
  @IsOptional()
  @IsEnum(UserRole, { message: "Role filter must be a valid user role" })
  role?: UserRole;

  @Field(() => UserStatus, {
    nullable: true,
    description: "Filter users by account status",
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: "Status filter must be a valid user status" })
  status?: UserStatus;

  @Field({
    nullable: true,
    description: "Filter users created from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created from filter must be an ISO date" })
  createdAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter users created until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Created to filter must be an ISO date" })
  createdAtTo?: string;

  @Field({
    nullable: true,
    description: "Filter users updated from this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated from filter must be an ISO date" })
  updatedAtFrom?: string;

  @Field({
    nullable: true,
    description: "Filter users updated until this ISO date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Updated to filter must be an ISO date" })
  updatedAtTo?: string;
}

@InputType()
export class UserListOffsetPageOptionsParamsInput extends OffsetPageOptionsParamsInput {
  @Field(() => UserListSortOptionInput, {
    nullable: true,
    description: "Sort options as a map of field names to sort order",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserListSortOptionInput)
  sort?: UserListSortOptionInput;
}

@InputType()
export class UserListGqlInput extends PaginationOffsetInput<UserListFilterInput> {
  @Field(() => UserListFilterInput, {
    nullable: true,
    description: "Filter options for narrowing down the user list",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserListFilterInput)
  filters?: UserListFilterInput;

  @Field(() => UserListOffsetPageOptionsParamsInput, {
    nullable: true,
    description: "Pagination and sorting options",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserListOffsetPageOptionsParamsInput)
  options?: UserListOffsetPageOptionsParamsInput;
}
