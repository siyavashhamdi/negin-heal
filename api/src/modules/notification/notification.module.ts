import { Module } from "@nestjs/common";

import { BadgeModule } from "../badge";
import { DatabaseModule } from "../database";
import { NotificationUpdateMutation } from "./graphql/mutations";
import { NotificationListQuery } from "./graphql/queries";
import { NotificationService } from "./notification.service";

@Module({
  imports: [BadgeModule, DatabaseModule],
  providers: [
    NotificationService,
    NotificationUpdateMutation,
    NotificationListQuery,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
