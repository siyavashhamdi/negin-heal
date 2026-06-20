import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { UserTicketDetailGqlInput } from "../inputs";
import { UserTicketListGqlResponse } from "../responses";

@Resolver(() => UserTicketListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.END_USER)
export class UserTicketDetailQuery {
  constructor(private readonly ticketService: TicketService) {}

  @Query(() => UserTicketListGqlResponse, {
    name: "userTicketDetail",
    description:
      "Get full support ticket data for the current END_USER, including messages and attachments for viewing and replying",
  })
  async findCurrentUserTicketDetail(
    @Args("input") input: UserTicketDetailGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserTicketListGqlResponse> {
    return this.ticketService.userDetail(input, context.req.user!.userId);
  }
}
