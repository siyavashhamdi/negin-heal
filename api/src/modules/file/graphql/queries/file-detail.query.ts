import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { GqlAuthGuard } from "../../../auth";
import { FileService } from "../../file.service";
import { FileDetailGqlInput } from "../inputs";
import { FileUploadGqlResponse } from "../responses";

@Resolver(() => FileUploadGqlResponse)
@UseGuards(GqlAuthGuard)
export class FileDetailQuery {
  constructor(private readonly fileService: FileService) {}

  @Query(() => FileUploadGqlResponse, {
    name: "fileDetail",
    description: "Get stored file metadata and preview path by ID",
  })
  async findById(
    @Args("input") input: FileDetailGqlInput,
  ): Promise<FileUploadGqlResponse> {
    return this.fileService.findById(input.id);
  }
}
