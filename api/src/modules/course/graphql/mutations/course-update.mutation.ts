import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseUpdateGqlInput } from "../inputs";
import { CourseListGqlResponse } from "../responses";

@Resolver(() => CourseListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CourseUpdateMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CourseListGqlResponse, {
    name: "courseUpdate",
    description:
      "Update a course and clean up replaced or removed file attachments",
  })
  async updateCourse(
    @Args("input") input: CourseUpdateGqlInput,
  ): Promise<CourseListGqlResponse> {
    return this.courseService.update(input);
  }
}
