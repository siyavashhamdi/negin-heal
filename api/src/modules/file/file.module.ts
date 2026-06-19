import { Module, forwardRef } from "@nestjs/common";

import { UnreferencedFileCleanupCron } from "../../cron/jobs/unreferenced-file-cleanup.cron";
import { AuthModule } from "../auth";
import { DatabaseModule } from "../database";
import { FileController } from "./api/file.controller";
import { FileService } from "./file.service";
import { UnreferencedFileCleanupService } from "./unreferenced-file-cleanup.service";

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [FileController],
  providers: [
    FileService,
    UnreferencedFileCleanupCron,
    UnreferencedFileCleanupService,
  ],
  exports: [FileService],
})
export class FileModule {}
