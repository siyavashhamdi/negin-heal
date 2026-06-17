import { Module, forwardRef } from "@nestjs/common";

import { AuthModule } from "../auth";
import { DatabaseModule } from "../database";
import { FileController } from "./api/file.controller";
import { FileService } from "./file.service";

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
