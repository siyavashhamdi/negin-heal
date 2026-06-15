import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserPasswordResetGqlResponse {
  @Field({ description: "Whether the operation was accepted" })
  success: boolean;

  @Field({ description: "Operation message" })
  message: string;
}
