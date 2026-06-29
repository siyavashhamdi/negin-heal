import { Transform, Type } from "class-transformer";
import { IsIn, IsOptional, ValidateIf, ValidateNested } from "class-validator";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import {
  AudioOutputExtension,
  MediaCompressionQuality,
  VideoOutputExtension,
} from "../../../../enums";
import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";
import { MEDIA_COMPRESSION_TARGET_QUALITIES } from "../../media-compression.constants";
import { MediaCompressionTrimGqlInput } from "./media-compression-trim.gql.input";

@InputType()
export class FileCompressMediaGqlInput {
  @Field(() => ID, { description: "Stored file ID to compress" })
  @IsObjectId({ message: "File ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  fileId: Types.ObjectId;

  @Field(() => MediaCompressionQuality, {
    description: "Target compression quality tier",
  })
  @IsIn(MEDIA_COMPRESSION_TARGET_QUALITIES, {
    message: "Target quality must be a valid media compression quality",
  })
  targetQuality: MediaCompressionQuality;

  @Field(() => VideoOutputExtension, {
    nullable: true,
    description:
      "Video container for video output. Required when compressing a video file to video.",
  })
  @ValidateIf((input) => !input.audioOutputExtension)
  @IsIn(Object.values(VideoOutputExtension), {
    message: "Video output extension must be a valid video format",
  })
  videoOutputExtension?: VideoOutputExtension | null;

  @Field(() => AudioOutputExtension, {
    nullable: true,
    description:
      "Audio container for audio output or audio extraction from video.",
  })
  @ValidateIf((input) => !input.videoOutputExtension)
  @IsIn(Object.values(AudioOutputExtension), {
    message: "Audio output extension must be a valid audio format",
  })
  audioOutputExtension?: AudioOutputExtension | null;

  @Field(() => MediaCompressionTrimGqlInput, {
    nullable: true,
    description: "Optional trim range in seconds",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MediaCompressionTrimGqlInput)
  trim?: MediaCompressionTrimGqlInput | null;
}
