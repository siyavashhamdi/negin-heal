import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Field, InputType } from "@nestjs/graphql";
import { SessionClientContextGqlInput } from "./session-client-context.gql.input";
import { IsLatinAuthIdentity } from "../../../../validators/latin-identity.validators";

@InputType()
export class UserLoginGqlInput {
  @Field({
    description: "User identity: registered username, email, or phone number",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  @IsLatinAuthIdentity()
  identity: string;

  @Field({ description: "User password" })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  password: string;

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

  @Field({
    nullable: true,
    description:
      "If true, the session will be remembered for a longer period (e.g., 30 days instead of 24 hours)",
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean({ message: "rememberMe must be a boolean" })
  rememberMe?: boolean;

  @Field(() => SessionClientContextGqlInput, {
    nullable: true,
    description: "Client device and browser context captured at login time",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SessionClientContextGqlInput)
  clientContext?: SessionClientContextGqlInput;
}
