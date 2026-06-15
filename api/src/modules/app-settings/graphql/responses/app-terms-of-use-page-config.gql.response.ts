import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AppTermsOfUsePageConfigGqlResponse {
  @Field({ description: "Trusted HTML content for the terms of use page" })
  html: string;
}
