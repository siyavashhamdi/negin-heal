import { Module } from "@nestjs/common";

import { TicketAutoCloseCron } from "../../cron/jobs";
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
import { TicketListQuery, UserTicketListQuery } from "./graphql/queries";

@Module({
  imports: [BadgeModule, DatabaseModule, FileModule],
  providers: [
    TicketAutoCloseCron,
    TicketAutoCloseService,
    TicketService,
    SuperAdminTicketSendMutation,
    TicketCloseMutation,
    UserTicketSendMutation,
    TicketListQuery,
    UserTicketListQuery,
  ],
  exports: [TicketService],
})
export class TicketModule {}
