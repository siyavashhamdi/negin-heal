import { Args, Context, ID, Mutation, Resolver } from "@nestjs/graphql";
import { BadRequestException, UseGuards } from "@nestjs/common";
import { Types } from "mongoose";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { TicketService } from "../../ticket.service";
import { TicketListGqlResponse, UserTicketListGqlResponse } from "../responses";

function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException("Ticket ID must be a valid MongoDB ObjectId");
  }

  return new Types.ObjectId(id);
}

@Resolver(() => TicketListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
export class TicketCloseMutation {
  constructor(private readonly ticketService: TicketService) {}

  @Mutation(() => TicketListGqlResponse, {
    name: "ticketClose",
    description: "Close a support ticket as support staff",
  })
  @Roles(UserRole.SUPER_ADMIN)
  async closeByStaff(
    @Args("id", { type: () => ID }) id: string,
    @Context() context: GraphQLContext,
  ): Promise<TicketListGqlResponse> {
    return this.ticketService.closeByStaff(toObjectId(id), context.req.user!.userId);
  }

  @Mutation(() => UserTicketListGqlResponse, {
    name: "userTicketClose",
    description: "Close one of the current end-user's support tickets",
  })
  @Roles(UserRole.END_USER)
  async closeByEndUser(
    @Args("id", { type: () => ID }) id: string,
    @Context() context: GraphQLContext,
  ): Promise<UserTicketListGqlResponse> {
    return this.ticketService.closeByEndUser(toObjectId(id), context.req.user!.userId);
  }
}
