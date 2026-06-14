import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";
import { Field, Float, InputType } from "@nestjs/graphql";

@InputType()
export class FileUploadGqlInput {
  @Field({ description: "Original file name including extension" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ description: "File MIME type" })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @Field(() => Float, { description: "File size in bytes" })
  @IsNumber()
  @Min(0)
  sizeBytes: number;

  @Field({ description: "Base64 encoded file content without data URL prefix" })
  @IsString()
  @IsNotEmpty()
  contentBase64: string;
}
