import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AppVersionConfigGqlResponse {
  @Field({ description: "Configured application version label" })
  value: string;
}
