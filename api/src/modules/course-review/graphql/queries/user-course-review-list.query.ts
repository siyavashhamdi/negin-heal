import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseReviewService } from "../../course-review.service";
import { UserCourseReviewListGqlInput } from "../inputs";
import {
  UserCourseReviewListGqlResponse,
  UserCourseReviewListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => UserCourseReviewListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.END_USER)
export class UserCourseReviewListQuery {
  constructor(private readonly courseReviewService: CourseReviewService) {}

  @Query(() => UserCourseReviewListPaginatedCursorGqlResponse, {
    name: "userCourseReviewList",
    description:
      "Get a cursor-paginated list of course reviews visible to the current END_USER",
  })
  async findUserCourseReviews(
    @Args("input") input: UserCourseReviewListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserCourseReviewListPaginatedCursorGqlResponse> {
    return this.courseReviewService.listForEndUser(
      input,
      context.req.user!.userId,
    );
  }
}
