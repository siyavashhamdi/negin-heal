import { IsNotEmpty, IsString, Matches } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UserResetPasswordGqlInput {
  @Field({
    description:
      "Username, email, or phone number used when requesting the password reset code",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  identity: string;

  @Field({ description: "One-time password reset code sent by email" })
  @IsString({ message: "Reset code must be a string" })
  @IsNotEmpty({ message: "Reset code is required" })
  @Matches(/^\d{6}$/, { message: "Reset code must be a 6-digit number" })
  otp: string;

  @Field({ description: "New account password" })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  newPassword: string;
}
