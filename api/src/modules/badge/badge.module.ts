import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { BadgeCountQuery } from "./graphql/queries";
import { BadgeService } from "./badge.service";

@Module({
  imports: [DatabaseModule],
  providers: [BadgeService, BadgeCountQuery],
})
export class BadgeModule {}
