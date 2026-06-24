import { Module } from "@nestjs/common";

import { TicketAutoCloseCron } from "../../cron/jobs";
import { AppSettingsModule } from "../app-settings";
import { BadgeModule } from "../badge";
import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { TicketAutoCloseService } from "./ticket-auto-close.service";
import { TicketService } from "./ticket.service";
import {
  SuperAdminTicketSendMutation,
  TicketCloseMutation,
  UserTicketSendMutation,
} from "./graphql/mutations";
import {
  TicketListQuery,
  TicketDetailQuery,
  UserTicketListQuery,
  UserTicketDetailQuery,
} from "./graphql/queries";

@Module({
  imports: [AppSettingsModule, BadgeModule, DatabaseModule, FileModule],
  providers: [
    TicketAutoCloseCron,
    TicketAutoCloseService,
    TicketService,
    SuperAdminTicketSendMutation,
    TicketCloseMutation,
    UserTicketSendMutation,
    UserTicketDetailQuery,
    TicketDetailQuery,
    TicketListQuery,
    UserTicketListQuery,
  ],
  exports: [TicketService],
})
export class TicketModule {}
