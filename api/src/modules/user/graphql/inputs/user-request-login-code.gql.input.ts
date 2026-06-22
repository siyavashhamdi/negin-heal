import { IsNotEmpty, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { IsLatinAuthIdentity } from "../../../../validators/latin-identity.validators";

@InputType()
export class UserRequestLoginCodeGqlInput {
  @Field({
    description: "User identity: registered username, email, or phone number",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  @IsLatinAuthIdentity()
  identity: string;
}
