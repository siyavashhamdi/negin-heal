import { IsNotEmpty, IsString } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UserRequestLoginCodeGqlInput {
  @Field({
    description: "User identity: registered username, email, or phone number",
  })
  @IsString({ message: "Identity must be a string" })
  @IsNotEmpty({ message: "Identity is required" })
  identity: string;
}
