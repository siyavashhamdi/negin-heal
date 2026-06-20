import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseDetailGqlInput } from "../inputs";
import { CourseListGqlResponse } from "../responses";

@Resolver(() => CourseListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CourseDetailQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => CourseListGqlResponse, {
    name: "courseDetail",
    description:
      "Get full course data for SUPER_ADMIN and ADMIN, including chapters and items for editing",
  })
  async findCourseDetail(
    @Args("input") input: CourseDetailGqlInput,
  ): Promise<CourseListGqlResponse> {
    return this.courseService.detail(input);
  }
}
