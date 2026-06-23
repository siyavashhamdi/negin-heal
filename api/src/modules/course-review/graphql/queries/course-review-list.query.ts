import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseReviewService } from "../../course-review.service";
import { CourseReviewListGqlInput } from "../inputs";
import {
  CourseReviewListGqlResponse,
  CourseReviewListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => CourseReviewListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CourseReviewListQuery {
  constructor(private readonly courseReviewService: CourseReviewService) {}

  @Query(() => CourseReviewListPaginatedCursorGqlResponse, {
    name: "courseReviewList",
    description:
      "Get a cursor-paginated, filterable, sortable staff list of course reviews with full data",
  })
  async findAllCourseReviews(
    @Args("input") input: CourseReviewListGqlInput,
  ): Promise<CourseReviewListPaginatedCursorGqlResponse> {
    return this.courseReviewService.listForSuperAdmin(input);
  }
}
