import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
class UserSignupProfileGqlInput {
  @Field({ description: "User first name" })
  @IsString({ message: "First name must be a string" })
  @IsNotEmpty({ message: "First name is required" })
  firstName: string;

  @Field({ description: "User last name" })
  @IsString({ message: "Last name must be a string" })
  @IsNotEmpty({ message: "Last name is required" })
  lastName: string;
}

@InputType()
export class UserSignupGqlInput {
  @Field({ nullable: true, description: "Preferred unique username" })
  @ValidateIf((value: UserSignupGqlInput) => !value.email && !value.mobile)
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "At least one identity is required" })
  @IsOptional()
  username?: string;

  @Field({ nullable: true, description: "Email address" })
  @ValidateIf((value: UserSignupGqlInput) => !value.username && !value.mobile)
  @IsString({ message: "Email must be a string" })
  @IsNotEmpty({ message: "At least one identity is required" })
  @IsOptional()
  email?: string;

  @Field({ nullable: true, description: "Mobile phone number" })
  @ValidateIf((value: UserSignupGqlInput) => !value.username && !value.email)
  @IsString({ message: "Mobile number must be a string" })
  @IsNotEmpty({ message: "At least one identity is required" })
  @IsOptional()
  mobile?: string;

  @Field(() => UserSignupProfileGqlInput, {
    description: "Mandatory profile data for signup",
  })
  @ValidateNested()
  @Type(() => UserSignupProfileGqlInput)
  profile: UserSignupProfileGqlInput;

  @Field({ nullable: true, description: "Account password for signup" })
  @IsOptional()
  @IsString({ message: "Password must be a string" })
  password?: string;

  @Field({
    nullable: true,
    description: "SMS verification code for mobile signup without password",
  })
  @IsOptional()
  @IsString({ message: "Signup verification code must be a string" })
  signupCode?: string;

  @Field({
    nullable: true,
    description:
      "If true, the newly-created session will be remembered longer (e.g. 30 days)",
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean({ message: "rememberMe must be a boolean" })
  rememberMe?: boolean;
}
