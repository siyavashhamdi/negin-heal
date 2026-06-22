import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole, UserStatus } from "../../../../enums";
import {
  UserProfileMinimalGqlResponse,
  UserMinimalGqlResponse,
  UserVerificationGqlResponse,
} from "./common";

@ObjectType()
export class UserPreferencesGqlResponse {
  @Field({ nullable: true, description: "User's preferred language" })
  language?: string;

  @Field({ nullable: true, description: "User's timezone" })
  timezone?: string;

  @Field({ description: "Whether notifications are enabled" })
  notificationsEnabled: boolean;

  @Field({ nullable: true, description: "User's theme preference" })
  theme?: string;
}

@ObjectType()
export class UserMeGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field({ description: "User username" })
  username: string;

  @Field(() => [UserRole], { description: "User roles" })
  roles: UserRole[];

  @Field(() => UserStatus, { description: "User status" })
  status: UserStatus;

  @Field(() => UserProfileMinimalGqlResponse, {
    nullable: true,
    description: "User profile information",
  })
  profile?: UserProfileMinimalGqlResponse;

  @Field(() => UserPreferencesGqlResponse, {
    nullable: true,
    description: "User preferences",
  })
  preferences?: UserPreferencesGqlResponse;

  @Field(() => UserVerificationGqlResponse, {
    description: "Email and mobile verification timestamps",
  })
  verification: UserVerificationGqlResponse;
}
