import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseCreateGqlInput } from "../inputs";
import { CourseListGqlResponse } from "../responses";

@Resolver(() => CourseListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CourseCreateMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CourseListGqlResponse, {
    name: "courseCreate",
    description:
      "Create a course with chapters and items, returning calculated release and item types",
  })
  async createCourse(
    @Args("input") input: CourseCreateGqlInput,
  ): Promise<CourseListGqlResponse> {
    return this.courseService.create(input);
  }
}
