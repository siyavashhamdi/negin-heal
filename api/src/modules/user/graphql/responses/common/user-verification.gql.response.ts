import { Field, GraphQLISODateTime, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserVerificationGqlResponse {
  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "UTC timestamp when the user's email was verified",
  })
  emailVerifiedAt?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: "UTC timestamp when the user's mobile number was verified",
  })
  mobileVerifiedAt?: Date;
}
