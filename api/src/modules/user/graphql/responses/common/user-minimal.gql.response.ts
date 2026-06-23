import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole } from "../../../../../enums";
import { FileAccessUrlGqlResponse } from "../../../../file/graphql/responses";

@ObjectType()
export class UserProfileMinimalGqlResponse {
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
export class UserMinimalGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field(() => UserProfileMinimalGqlResponse, {
    nullable: true,
    description: "User profile information",
  })
  profile?: UserProfileMinimalGqlResponse;

  @Field(() => [UserRole], {
    nullable: true,
    description: "User roles when explicitly loaded",
  })
  roles?: UserRole[];
}
