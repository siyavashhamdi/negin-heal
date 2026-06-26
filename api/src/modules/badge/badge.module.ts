import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { PushNotificationModule } from "../push-notification";
import { UserModule } from "../user";
import { BadgeCountQuery } from "./graphql/queries";
import { BadgeService } from "./badge.service";

@Module({
  imports: [DatabaseModule, UserModule, PushNotificationModule],
  providers: [BadgeService, BadgeCountQuery],
  exports: [BadgeService],
})
export class BadgeModule {}
