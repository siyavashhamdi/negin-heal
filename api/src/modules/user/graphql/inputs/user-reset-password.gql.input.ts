import { IsNotEmpty, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UserResetPasswordGqlInput {
  @Field({
    description:
      "Password reset link sent by email, or the token from that link",
  })
  @IsString({ message: "Reset link must be a string" })
  @IsNotEmpty({ message: "Reset link is required" })
  resetLink: string;

  @Field({ description: "New account password" })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  newPassword: string;
}
