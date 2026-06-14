import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { GqlAuthGuard } from "../../../auth";
import { UserService } from "../../user.service";
import { GraphQLContextUtil } from "../../../../utils";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { UserRequestLoginCodeGqlResponse } from "../responses";

@Resolver(() => UserRequestLoginCodeGqlResponse)
@UseGuards(GqlAuthGuard)
export class UserSendSampleEmailMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserRequestLoginCodeGqlResponse, {
    name: "userSendSampleEmail",
    description:
      "Send a sample email using configured SMTP credentials to a target email for dashboard testing",
  })
  async sendSampleEmail(
    @Context() context: GraphQLContext,
    @Args("to", {
      nullable: true,
      type: () => String,
      description:
        "Optional recipient email. If omitted, the authenticated user's email is used.",
    })
    to?: string,
  ): Promise<UserRequestLoginCodeGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);
    return this.userService.sendSampleEmail(user.userId, to);
  }
}
