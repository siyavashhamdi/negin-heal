import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseReviewService } from "../../course-review.service";
import { CourseReviewSubmitGqlInput } from "../inputs";
import { CourseReviewSubmitGqlResponse } from "../responses";

@Resolver(() => CourseReviewSubmitGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.END_USER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CourseReviewSubmitMutation {
  constructor(private readonly courseReviewService: CourseReviewService) {}

  @Mutation(() => CourseReviewSubmitGqlResponse, {
    name: "courseReviewSubmit",
    description:
      "Create or update a course star rating and optionally append a follow-up comment for a paid course enrollment",
  })
  async submitCourseReview(
    @Args("input") input: CourseReviewSubmitGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CourseReviewSubmitGqlResponse> {
    const user = context.req.user!;

    return this.courseReviewService.submitReview(
      input,
      user.userId,
      user.roles ?? [],
    );
  }
}
