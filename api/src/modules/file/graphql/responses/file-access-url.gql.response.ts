import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

@ObjectType()
export class FileAccessUrlGqlResponse {
  @Field({
    nullable: true,
    description:
      "Public app origin for file requests. Falls back to the browser origin on the client when omitted.",
  })
  baseUrl?: string;

  @Field({
    description:
      "API path prefix for file content requests, e.g. /api/v1/files",
  })
  apiPath: string;

  @Field(() => ID, { description: "Stored file ID" })
  fileId: Types.ObjectId;

  @Field({ description: "Signed access token for the file content endpoint" })
  token: string;

  @Field({
    nullable: true,
    description: "Original stored file name including extension",
  })
  name?: string;

  @Field({
    nullable: true,
    description: "Stored file MIME type",
  })
  mimeType?: string;

  @Field(() => Float, {
    nullable: true,
    description: "Stored file size in bytes",
  })
  sizeBytes?: number;
}
