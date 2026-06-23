import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { TicketDetailGqlInput } from "../inputs";
import { TicketListGqlResponse } from "../responses";

@Resolver(() => TicketListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class TicketDetailQuery {
  constructor(private readonly ticketService: TicketService) {}

  @Query(() => TicketListGqlResponse, {
    name: "ticketDetail",
    description:
      "Get full support ticket data for SUPER_ADMIN, including messages and attachments for review",
  })
  async findTicketDetail(
    @Args("input") input: TicketDetailGqlInput,
  ): Promise<TicketListGqlResponse> {
    return this.ticketService.detail(input);
  }
}
