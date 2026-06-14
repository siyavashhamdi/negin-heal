import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { GqlAuthGuard } from "../../../auth";
import { FileService } from "../../file.service";
import { FileUploadGqlInput } from "../inputs";
import { FileUploadGqlResponse } from "../responses";

@Resolver(() => FileUploadGqlResponse)
@UseGuards(GqlAuthGuard)
export class FileUploadMutation {
  constructor(private readonly fileService: FileService) {}

  @Mutation(() => FileUploadGqlResponse, {
    name: "fileUpload",
    description: "Upload a file to MinIO and store its metadata",
  })
  async upload(
    @Args("input") input: FileUploadGqlInput,
  ): Promise<FileUploadGqlResponse> {
    return this.fileService.upload(input);
  }
}
