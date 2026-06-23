import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseReviewService } from "../../course-review.service";
import { CourseReviewModerationUpdateGqlInput } from "../inputs/course-review-moderation-update.gql.input";
import { CourseReviewListGqlResponse } from "../responses";

@Resolver(() => CourseReviewListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CourseReviewModerationUpdateMutation {
  constructor(private readonly courseReviewService: CourseReviewService) {}

  @Mutation(() => CourseReviewListGqlResponse, {
    name: "courseReviewModerationUpdate",
    description:
      "Update course review moderation visibility for the review thread, rating, or a single message",
  })
  async updateCourseReviewModeration(
    @Args("input") input: CourseReviewModerationUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CourseReviewListGqlResponse> {
    const user = context.req.user!;

    return this.courseReviewService.updateModeration(input, user.userId);
  }
}
