import { IsNotEmpty, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UserRequestSignupCodeGqlInput {
  @Field({ description: "Mobile phone number for signup verification code" })
  @IsString({ message: "Mobile number must be a string" })
  @IsNotEmpty({ message: "Mobile number is required" })
  mobile: string;
}
