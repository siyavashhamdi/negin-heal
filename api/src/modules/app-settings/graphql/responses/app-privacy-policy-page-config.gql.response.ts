import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AppPrivacyPolicyPageConfigGqlResponse {
  @Field({ description: "Trusted HTML content for the privacy policy page" })
  html: string;
}
