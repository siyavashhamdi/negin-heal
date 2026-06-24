import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CourseChapterCompleteGqlInput } from "../inputs";
import { CourseChapterCompleteGqlResponse } from "../responses";

@Resolver(() => CourseChapterCompleteGqlResponse)
@UseGuards(GqlAuthGuard)
export class CourseChapterCompleteMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CourseChapterCompleteGqlResponse, {
    name: "courseChapterComplete",
    description:
      "Confirm completion of an unlocked course chapter for the authenticated learner",
  })
  async completeCourseChapter(
    @Args("input") input: CourseChapterCompleteGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CourseChapterCompleteGqlResponse> {
    const user = context.req.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (!user || !isEndUser) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.END_USER_ONLY);
    }

    return this.courseService.completeChapter(input, user.userId);
  }
}
