import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min, ValidateNested } from "class-validator";
import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class MediaCompressionTrimGqlInput {
  @Field(() => Float, {
    nullable: true,
    description:
      "Trim start position in seconds. Omit or null to start from the beginning.",
  })
  @IsOptional()
  @IsNumber({}, { message: "Trim start seconds must be a number" })
  @Min(0, { message: "Trim start seconds cannot be negative" })
  startSeconds?: number | null;

  @Field(() => Float, {
    nullable: true,
    description:
      "Trim end position in seconds. Omit or null to keep until the end.",
  })
  @IsOptional()
  @IsNumber({}, { message: "Trim end seconds must be a number" })
  @Min(0, { message: "Trim end seconds cannot be negative" })
  endSeconds?: number | null;
}
