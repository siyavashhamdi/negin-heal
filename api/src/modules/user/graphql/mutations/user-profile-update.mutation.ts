import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GraphQLContextUtil } from "../../../../utils";
import { GqlAuthGuard } from "../../../auth";
import { UserService } from "../../user.service";
import { UserProfileUpdateGqlInput } from "../inputs";
import { UserMutationGqlResponse } from "../responses";

@Resolver(() => UserMutationGqlResponse)
@UseGuards(GqlAuthGuard)
export class UserProfileUpdateMutation {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => UserMutationGqlResponse, {
    name: "userProfileUpdate",
    description:
      "Update the authenticated user's user document: account info, profile, preferences, avatar file, or password",
  })
  async updateProfile(
    @Args("input") input: UserProfileUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserMutationGqlResponse> {
    const user = GraphQLContextUtil.getUser(context);

    return this.userService.updateProfile(user.userId, input);
  }
}
