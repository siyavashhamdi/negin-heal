import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { FileAccessUrlGqlResponse } from "../../../file/graphql/responses";
import { UserRole, UserStatus } from "../../../../enums";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";
import { UserPreferencesGqlResponse } from "./user-me.gql.response";

@ObjectType()
export class UserListProfileGqlResponse {
  @Field({ nullable: true, description: "User's first name" })
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  lastName?: string;

  @Field({ nullable: true, description: "User's email address" })
  email?: string;

  @Field({ nullable: true, description: "User's phone number" })
  phoneNumber?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for the user's avatar",
  })
  avatarAccessUrl?: FileAccessUrlGqlResponse;

  @Field({ nullable: true, description: "User biography" })
  bio?: string;
}

@ObjectType()
export class UserListSummaryProfileGqlResponse {
  @Field({ nullable: true, description: "User's first name" })
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  lastName?: string;

  @Field({ nullable: true, description: "User's email address" })
  email?: string;

  @Field({ nullable: true, description: "User's phone number" })
  phoneNumber?: string;

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed access descriptor for the user's avatar",
  })
  avatarAccessUrl?: FileAccessUrlGqlResponse;

  @Field({ nullable: true, description: "User biography" })
  bio?: string;
}

@ObjectType()
export class UserListSummaryGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field({ description: "Username" })
  username: string;

  @Field(() => [UserRole], { description: "User roles" })
  roles: UserRole[];

  @Field(() => UserStatus, { description: "User account status" })
  status: UserStatus;

  @Field(() => UserListSummaryProfileGqlResponse, {
    nullable: true,
    description: "User profile details for list display",
  })
  profile?: UserListSummaryProfileGqlResponse;

  @Field({ nullable: true, description: "Date when the user was created" })
  createdAt?: Date;

  @Field({ nullable: true, description: "Date when the user was last updated" })
  updatedAt?: Date;
}

@ObjectType()
export class UserListGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field({ description: "Username" })
  username: string;

  @Field(() => [UserRole], { description: "User roles" })
  roles: UserRole[];

  @Field(() => UserStatus, { description: "User account status" })
  status: UserStatus;

  @Field(() => UserListProfileGqlResponse, {
    nullable: true,
    description: "User profile details",
  })
  profile?: UserListProfileGqlResponse;

  @Field({ nullable: true, description: "Date when the user was created" })
  createdAt?: Date;

  @Field({ nullable: true, description: "Date when the user was last updated" })
  updatedAt?: Date;
}

@ObjectType()
export class UserMutationGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field({ description: "Username" })
  username: string;

  @Field(() => [UserRole], { description: "User roles" })
  roles: UserRole[];

  @Field(() => UserStatus, { description: "User account status" })
  status: UserStatus;

  @Field(() => UserListProfileGqlResponse, {
    nullable: true,
    description: "User profile details",
  })
  profile?: UserListProfileGqlResponse;

  @Field(() => UserPreferencesGqlResponse, {
    nullable: true,
    description: "User preferences",
  })
  preferences?: UserPreferencesGqlResponse;
}

@ObjectType()
export class UserListPaginatedOffsetGqlResponse {
  @Field(() => [UserListSummaryGqlResponse], {
    description: "List of users",
  })
  items: UserListSummaryGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
