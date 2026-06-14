import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CoursePurchaseSubmitGqlInput } from "../inputs";
import { CoursePurchaseSubmitGqlResponse } from "../responses";

@Resolver(() => CoursePurchaseSubmitGqlResponse)
@UseGuards(GqlAuthGuard)
export class CoursePurchaseSubmitMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CoursePurchaseSubmitGqlResponse, {
    name: "coursePurchaseSubmit",
    description:
      "Submit a course purchase using gateway, card-to-card, cryptocurrency, or a free coupon",
  })
  async submitCoursePurchase(
    @Args("input") input: CoursePurchaseSubmitGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CoursePurchaseSubmitGqlResponse> {
    const user = context.req.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (!user || !isEndUser) {
      throw new ForbiddenException(
        "coursePurchaseSubmit is only available to END_USER accounts",
      );
    }

    return this.courseService.submitPurchase(input, user.userId);
  }
}
