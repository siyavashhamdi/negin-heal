import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseListGqlInput } from "../inputs";
import {
  CourseListSummaryGqlResponse,
  CourseListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => CourseListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CourseListQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => CourseListPaginatedCursorGqlResponse, {
    name: "courseList",
    description:
      "Get a paginated, filterable, sortable admin list of courses with calculated release and item types",
  })
  async findAllCourses(
    @Args("input") input: CourseListGqlInput,
  ): Promise<CourseListPaginatedCursorGqlResponse> {
    return this.courseService.list(input);
  }
}
