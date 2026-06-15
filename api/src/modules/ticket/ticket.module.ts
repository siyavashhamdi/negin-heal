import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database";
import { FileModule } from "../file";
import { TicketService } from "./ticket.service";
import {
  SuperAdminTicketSendMutation,
  TicketCloseMutation,
  UserTicketSendMutation,
} from "./graphql/mutations";
import { TicketListQuery, UserTicketListQuery } from "./graphql/queries";

@Module({
  imports: [DatabaseModule, FileModule],
  providers: [
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
