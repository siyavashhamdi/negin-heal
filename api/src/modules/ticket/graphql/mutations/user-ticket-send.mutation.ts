import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { UserTicketSendGqlInput } from "../inputs";
import { UserTicketListGqlResponse } from "../responses";

@Resolver(() => UserTicketListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.END_USER)
export class UserTicketSendMutation {
  constructor(private readonly ticketService: TicketService) {}

  @Mutation(() => UserTicketListGqlResponse, {
    name: "userTicketSend",
    description:
      "Create a ticket or append a new END_USER update to an owned ticket, automatically reopening it if needed",
  })
  async sendByEndUser(
    @Args("input") input: UserTicketSendGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserTicketListGqlResponse> {
    return this.ticketService.sendByEndUser(input, context.req.user!.userId);
  }
}
