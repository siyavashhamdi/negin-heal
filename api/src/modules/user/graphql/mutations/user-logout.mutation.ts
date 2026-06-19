import { UseGuards } from "@nestjs/common";
import { Mutation, Resolver, Context } from "@nestjs/graphql";

import { UserService } from "../../user.service";
import { GqlAuthGuard } from "../../../auth";
import { GraphQLContext } from "../../../../types/graphql-context.types";

@Resolver()
@UseGuards(GqlAuthGuard)
export class UserLogoutMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => Boolean, {
    name: "userLogout",
    description: "Logout and mark the current session as logged out",
  })
  async logout(@Context() context: GraphQLContext): Promise<boolean> {
    // Get user context from GraphQL request
    const user = context.req?.user;

    if (!user?.sessionId) {
      return false;
    }

    await this.userService.logout(user.sessionId);
    return true;
  }
}
