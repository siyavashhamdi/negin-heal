import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { SuperAdminTicketSendGqlInput } from "../inputs";
import { TicketListGqlResponse } from "../responses";

@Resolver(() => TicketListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminTicketSendMutation {
  constructor(private readonly ticketService: TicketService) {}

  @Mutation(() => TicketListGqlResponse, {
    name: "superAdminTicketSend",
    description:
      "Create a ticket or append a new super-admin update to an existing ticket, automatically reopening it if needed",
  })
  async sendBySuperAdmin(
    @Args("input") input: SuperAdminTicketSendGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<TicketListGqlResponse> {
    return this.ticketService.sendBySuperAdmin(input, context.req.user!.userId);
  }
}
