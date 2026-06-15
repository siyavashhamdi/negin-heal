import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserLoginCaptchaGqlResponse {
  @Field({ description: "Unique captcha identifier used for verification" })
  captchaId: string;

  @Field({ description: "Captcha image bytes encoded as Base64 string" })
  imageBase64: string;

  @Field({ description: "Captcha image MIME type" })
  imageMimeType: string;

  @Field({ description: "Captcha expiration time as ISO timestamp" })
  expiresAtIso: string;
}
