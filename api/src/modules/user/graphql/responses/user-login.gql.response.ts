import { Types } from "mongoose";
import { Field, ID, ObjectType } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";

@ObjectType()
export class UserLoginUserGqlResponse {
  @Field(() => ID, { description: "User ID" })
  id: Types.ObjectId;

  @Field({ description: "User username" })
  username: string;

  @Field(() => [UserRole], { description: "User roles" })
  roles: UserRole[];
}

@ObjectType()
export class UserLoginGqlResponse {
  @Field({ description: "JWT access token" })
  accessToken: string;

  @Field(() => UserLoginUserGqlResponse, { description: "User information" })
  user: UserLoginUserGqlResponse;
}
