import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { FileService } from "./file.service";
import { FileUploadMutation } from "./graphql/mutations";
import { FileDetailQuery } from "./graphql/queries";

@Module({
  imports: [DatabaseModule],
  providers: [FileService, FileUploadMutation, FileDetailQuery],
  exports: [FileService],
})
export class FileModule {}
