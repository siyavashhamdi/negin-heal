import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseDeleteGqlInput } from "../inputs";

@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CourseDeleteMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => Boolean, {
    name: "courseDelete",
    description: "Delete a course and remove its detached file attachments",
  })
  async deleteCourse(
    @Args("input") input: CourseDeleteGqlInput,
  ): Promise<boolean> {
    await this.courseService.delete(input);
    return true;
  }
}
