import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UserVerifyLoginCodeGqlInput {
  @Field({
    description: "User identity used when requesting the login code",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  identity: string;

  @Field({ description: "SMS one-time password" })
  @IsString({ message: "Code must be a string" })
  @IsNotEmpty({ message: "Code is required" })
  code: string;

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
