import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Field, InputType } from "@nestjs/graphql";
import { MIN_USERNAME_LENGTH } from "../../../../utils/username-policy.util";
import { SessionClientContextGqlInput } from "./session-client-context.gql.input";
import {
  IsAuthIdentityMobile,
  IsLatinEmail,
  IsLatinUsername,
} from "../../../../validators/latin-identity.validators";

@InputType()
class UserSignupProfileGqlInput {
  @Field({ description: "User first name" })
  @IsString({ message: "First name must be a string" })
  @IsNotEmpty({ message: "First name is required" })
  firstName: string;

  @Field({ nullable: true, description: "User last name" })
  @IsOptional()
  @IsString({ message: "Last name must be a string" })
  lastName?: string | null;
}

@InputType()
export class UserSignupGqlInput {
  @Field({ nullable: true, description: "Preferred unique username" })
  @ValidateIf((value: UserSignupGqlInput) => !value.email && !value.mobile)
  @IsString({ message: "Username must be a string" })
  @IsNotEmpty({ message: "At least one identity is required" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @MinLength(MIN_USERNAME_LENGTH, {
    message: `Username must be at least ${MIN_USERNAME_LENGTH} characters long`,
  })
  @IsLatinUsername()
  @IsOptional()
  username?: string;

  @Field({ nullable: true, description: "Email address" })
  @ValidateIf((value: UserSignupGqlInput) => !value.username && !value.mobile)
  @IsString({ message: "Email must be a string" })
  @IsNotEmpty({ message: "At least one identity is required" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @IsLatinEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true, description: "Mobile phone number" })
  @ValidateIf((value: UserSignupGqlInput) => !value.username && !value.email)
  @IsString({ message: "Mobile number must be a string" })
  @IsNotEmpty({ message: "At least one identity is required" })
  @ValidateIf(
    (_, value) => typeof value === "string" && value.trim().length > 0,
  )
  @IsAuthIdentityMobile()
  @IsOptional()
  mobile?: string;

  @Field(() => UserSignupProfileGqlInput, {
    description:
      "Profile data for signup (first name required; last name optional)",
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
      "If true, the newly-created session will be remembered longer (e.g. 30 days)",
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean({ message: "rememberMe must be a boolean" })
  rememberMe?: boolean;

  @Field(() => SessionClientContextGqlInput, {
    nullable: true,
    description: "Client device and browser context captured at signup time",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SessionClientContextGqlInput)
  clientContext?: SessionClientContextGqlInput;
}
