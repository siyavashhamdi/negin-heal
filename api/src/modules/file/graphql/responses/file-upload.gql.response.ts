import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

@ObjectType()
export class FileUploadGqlResponse {
  @Field(() => ID, { description: "Stored file ID" })
  id: Types.ObjectId;

  @Field({ description: "Original file name" })
  name: string;

  @Field({ description: "File MIME type" })
  mimeType: string;

  @Field(() => Float, { description: "File size in bytes" })
  sizeBytes: number;

  @Field({ description: "MinIO object path stored for this file" })
  path: string;

  @Field(() => Date, { description: "Upload completion date" })
  uploadedAt: Date;

  @Field({
    nullable: true,
    description: "Temporary URL for reading the stored file",
  })
  accessUrl?: string;
}
