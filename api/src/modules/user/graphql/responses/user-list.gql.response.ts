import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole, UserStatus } from "../../../../enums";
import { PaginationOffsetResponse } from "../../../../common/pagination/response";

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

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the user's avatar",
  })
  avatarFileId?: Types.ObjectId;

  @Field({ nullable: true, description: "User biography" })
  bio?: string;
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
}

@ObjectType()
export class UserListPaginatedOffsetGqlResponse {
  @Field(() => [UserListGqlResponse], {
    description: "List of users",
  })
  items: UserListGqlResponse[];

  @Field(() => PaginationOffsetResponse, {
    description: "Pagination metadata",
  })
  pagination: PaginationOffsetResponse;
}
