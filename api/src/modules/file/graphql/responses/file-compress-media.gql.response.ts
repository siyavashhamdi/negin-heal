import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Types } from "mongoose";

import {
  MediaCodecFamily,
  MediaCompressionQuality,
  MediaCompressionSkipReason,
  MediaType,
} from "../../../../enums";
import { FileUploadGqlResponse } from "./file-upload.gql.response";
import {
  MediaCompressionTrimGqlResponse,
  MediaResolutionGqlResponse,
} from "./media-compression.gql.response";

@ObjectType()
export class FileCompressMediaGqlResponse {
  @Field(() => Int, { description: "Processing duration in milliseconds" })
  durationMs: number;

  @Field(() => MediaCompressionQuality, {
    description: "Detected quality tier before compression",
  })
  previousQuality: MediaCompressionQuality;

  @Field(() => MediaCompressionQuality, {
    description: "Quality tier after compression or skip evaluation",
  })
  currentQuality: MediaCompressionQuality;

  @Field(() => MediaType, { description: "Resulting media type" })
  mediaType: MediaType;

  @Field({
    description: "Whether a new compressed file was created and stored",
  })
  wasCompressed: boolean;

  @Field(() => MediaCompressionSkipReason, {
    description: "Reason compression was skipped, if applicable",
  })
  skipReason: MediaCompressionSkipReason;

  @Field(() => ID, { description: "Previous stored file ID" })
  previousFileId: Types.ObjectId;

  @Field(() => ID, {
    description: "Current stored file ID after compression or skip",
  })
  fileId: Types.ObjectId;

  @Field(() => FileUploadGqlResponse, {
    description: "Current stored file metadata",
  })
  file: FileUploadGqlResponse;

  @Field(() => MediaCompressionTrimGqlResponse, {
    description: "Requested and applied trim details",
  })
  trim: MediaCompressionTrimGqlResponse;

  @Field(() => Float, { description: "Previous file size in bytes" })
  previousSizeBytes: number;

  @Field(() => Float, { description: "Current file size in bytes" })
  currentSizeBytes: number;

  @Field(() => Float, {
    description: "Ratio of current size to previous size",
  })
  compressionRatio: number;

  @Field({ description: "Previous file extension without dot" })
  previousExtension: string;

  @Field({ description: "Current file extension without dot" })
  currentExtension: string;

  @Field({ description: "Previous media codec name" })
  previousCodec: string;

  @Field({ description: "Current media codec name" })
  currentCodec: string;

  @Field(() => MediaCodecFamily, {
    description: "Previous codec family",
  })
  previousCodecFamily: MediaCodecFamily;

  @Field(() => MediaCodecFamily, {
    description: "Current codec family",
  })
  currentCodecFamily: MediaCodecFamily;

  @Field(() => Float, {
    nullable: true,
    description: "Previous media bitrate in kilobits per second",
  })
  previousBitrateKbps?: number | null;

  @Field(() => Float, {
    nullable: true,
    description: "Current media bitrate in kilobits per second",
  })
  currentBitrateKbps?: number | null;

  @Field(() => MediaResolutionGqlResponse, {
    description: "Previous video resolution",
  })
  previousResolution: MediaResolutionGqlResponse;

  @Field(() => MediaResolutionGqlResponse, {
    description: "Current video resolution",
  })
  currentResolution: MediaResolutionGqlResponse;

  @Field(() => Float, {
    description: "Resulting media duration in seconds after trim",
  })
  mediaDurationSeconds: number;
}
