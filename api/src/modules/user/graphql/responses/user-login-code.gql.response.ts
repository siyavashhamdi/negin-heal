import { Types } from "mongoose";
import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserRequestLoginCodeGqlResponse {
  @Field({ description: "Whether a login code was created and queued" })
  success: boolean;

  @Field({ description: "Operation message" })
  message: string;
}

@ObjectType()
export class UserVerifyLoginCodeGqlResponse {
  @Field({ description: "Whether the login code was accepted" })
  success: boolean;

  @Field({ description: "Operation message" })
  message: string;

  @Field(() => ID, {
    nullable: true,
    description: "User ID when verification succeeded",
  })
  userId?: Types.ObjectId;

  @Field({
    nullable: true,
    description: "JWT access token when verification succeeded",
  })
  accessToken?: string;
}
