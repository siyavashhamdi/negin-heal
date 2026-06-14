import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserResolveAuthIdentityGqlResponse {
  @Field({ description: "Whether the identity already belongs to an account" })
  exists: boolean;
}
