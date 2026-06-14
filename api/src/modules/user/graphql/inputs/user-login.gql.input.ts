import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UserLoginGqlInput {
  @Field({
    description: "User identity: registered username, email, or phone number",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  identity: string;

  @Field({ description: "User password" })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  @Field({
    nullable: true,
    description: "Captcha token submitted by the client for password login",
  })
  @IsOptional()
  @IsString({ message: "Captcha token must be a string" })
  captchaToken?: string;

  @Field({
    nullable: true,
    description:
      "If true, the session will be remembered for a longer period (e.g., 30 days instead of 24 hours)",
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean({ message: "rememberMe must be a boolean" })
  rememberMe?: boolean;
}
