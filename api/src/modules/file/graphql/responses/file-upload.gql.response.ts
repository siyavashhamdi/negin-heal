import { Field, Float, ObjectType } from "@nestjs/graphql";

import { FileAccessUrlGqlResponse } from "./file-access-url.gql.response";

@ObjectType()
export class FileUploadGqlResponse {
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

  @Field(() => FileAccessUrlGqlResponse, {
    nullable: true,
    description: "Signed file access descriptor for reading the stored file",
  })
  accessUrl?: FileAccessUrlGqlResponse;
}
