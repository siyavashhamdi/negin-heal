import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseDeleteGqlInput } from "../inputs";
import { CourseDeleteDependenciesGqlResponse } from "../responses";

@Resolver(() => CourseDeleteDependenciesGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CourseDeleteDependenciesQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => CourseDeleteDependenciesGqlResponse, {
    name: "courseDeleteDependencies",
    description:
      "Inspect related records before deleting a course, including retained and removed dependencies",
  })
  async findCourseDeleteDependencies(
    @Args("input") input: CourseDeleteGqlInput,
  ): Promise<CourseDeleteDependenciesGqlResponse> {
    return this.courseService.getDeleteDependencies(input);
  }
}
