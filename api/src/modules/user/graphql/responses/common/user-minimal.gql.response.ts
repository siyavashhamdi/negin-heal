import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

@ObjectType()
export class UserProfileMinimalGqlResponse {
  @Field({ nullable: true, description: "User's first name" })
  firstName?: string;

  @Field({ nullable: true, description: "User's last name" })
  lastName?: string;

  @Field(() => ID, {
    nullable: true,
    description: "Stored file ID used as the user's avatar",
  })
  avatarFileId?: Types.ObjectId;
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
}
