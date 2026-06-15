import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AppAboutPageConfigGqlResponse {
  @Field({ description: "Trusted HTML content for the about page" })
  html: string;
}
