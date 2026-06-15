import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { TicketListGqlInput } from "../inputs";
import {
  TicketListGqlResponse,
  TicketListPaginatedOffsetGqlResponse,
} from "../responses";

@Resolver(() => TicketListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class TicketListQuery {
  constructor(private readonly ticketService: TicketService) {}

  @Query(() => TicketListPaginatedOffsetGqlResponse, {
    name: "ticketList",
    description:
      "Get a paginated, filterable, sortable super-admin list of support tickets using offset-based pagination",
  })
  async findAllTickets(
    @Args("input") input: TicketListGqlInput,
  ): Promise<TicketListPaginatedOffsetGqlResponse> {
    return this.ticketService.list(input);
  }
}
