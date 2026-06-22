import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { IsLatinAuthIdentity } from "../../../../validators/latin-identity.validators";

@InputType()
export class UserForgotPasswordGqlInput {
  @Field({
    description: "User identity: registered username, email, or phone number",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  @IsLatinAuthIdentity()
  identity: string;

  @Field({
    nullable: true,
    description: "Captcha challenge identifier issued by the backend",
  })
  @IsOptional()
  @IsString({ message: "Captcha ID must be a string" })
  captchaId?: string;

  @Field({
    nullable: true,
    description: "Captcha answer entered by the user",
  })
  @IsOptional()
  @IsString({ message: "Captcha value must be a string" })
  captchaValue?: string;
}
