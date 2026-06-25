import { Module, forwardRef } from "@nestjs/common";

import { UnreferencedFileCleanupCron } from "../../cron/jobs/unreferenced-file-cleanup.cron";
import { AuthModule } from "../auth";
import { DatabaseModule } from "../database";
import { FileController } from "./api/file.controller";
import { FileService } from "./file.service";
import { ImageCompressionService } from "./image-compression.service";
import { MediaCompressionService } from "./media-compression.service";
import { UnreferencedFileCleanupService } from "./unreferenced-file-cleanup.service";
import { FileCompressMediaMutation } from "./graphql/mutations";

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [FileController],
  providers: [
    FileService,
    ImageCompressionService,
    MediaCompressionService,
    UnreferencedFileCleanupCron,
    UnreferencedFileCleanupService,
    FileCompressMediaMutation,
  ],
  exports: [FileService],
})
export class FileModule {}
