import { ArrayNotEmpty, ArrayUnique, IsEnum } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

import { BackupTarget } from "../../../../enums";

@InputType()
export class BackupRunGqlInput {
  @Field(() => [BackupTarget], {
    description:
      "Backup sources to archive as password-protected RAR and deliver to Telegram",
  })
  @ArrayNotEmpty({ message: "At least one backup target is required" })
  @ArrayUnique({ message: "Backup targets must be unique" })
  @IsEnum(BackupTarget, {
    each: true,
    message: "Each backup target must be MONGODB or MINIO",
  })
  targets: BackupTarget[];
}
