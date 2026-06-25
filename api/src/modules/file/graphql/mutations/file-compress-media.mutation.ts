import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Types } from "mongoose";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { MediaCompressionService } from "../../media-compression.service";
import { FileCompressMediaGqlInput } from "../inputs";
import { FileCompressMediaGqlResponse } from "../responses";

@Resolver(() => FileCompressMediaGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class FileCompressMediaMutation {
  constructor(
    private readonly mediaCompressionService: MediaCompressionService,
  ) {}

  @Mutation(() => FileCompressMediaGqlResponse, {
    name: "fileCompressMedia",
    description:
      "Compress or trim an existing stored video/audio file with ffmpeg, replacing it with a new stored file record",
  })
  async compressMedia(
    @Args("input") input: FileCompressMediaGqlInput,
  ): Promise<FileCompressMediaGqlResponse> {
    const result = await this.mediaCompressionService.compressMedia({
      sourceFileId: input.fileId.toString(),
      targetQuality: input.targetQuality,
      videoOutputExtension: input.videoOutputExtension,
      audioOutputExtension: input.audioOutputExtension,
      trim: input.trim,
    });

    return {
      ...result,
      previousFileId: new Types.ObjectId(result.previousFileId),
      fileId: new Types.ObjectId(result.fileId),
    };
  }
}
