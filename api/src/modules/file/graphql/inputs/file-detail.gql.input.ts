import { IsMongoId } from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";

@InputType()
export class FileDetailGqlInput {
  @Field(() => ID, { description: "Stored file ID" })
  @IsMongoId()
  id: string;
}
