import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { UserTicketListGqlInput } from "../inputs";
import {
  UserTicketListSummaryGqlResponse,
  UserTicketListPaginatedOffsetGqlResponse,
} from "../responses";

@Resolver(() => UserTicketListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.END_USER)
export class UserTicketListQuery {
  constructor(private readonly ticketService: TicketService) {}

  @Query(() => UserTicketListPaginatedOffsetGqlResponse, {
    name: "userTicketList",
    description:
      "Get a paginated, filterable, sortable list of support tickets owned by the current END_USER",
  })
  async findCurrentUserTickets(
    @Args("input") input: UserTicketListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserTicketListPaginatedOffsetGqlResponse> {
    return this.ticketService.listForUser(input, context.req.user!.userId);
  }
}
