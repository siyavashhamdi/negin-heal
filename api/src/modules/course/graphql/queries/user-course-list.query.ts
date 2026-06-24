import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";

import { UserRole } from "../../../../enums";
import { OptionalGqlAuthGuard } from "../../../auth";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { CourseService } from "../../course.service";
import { CourseListGqlInput } from "../inputs";
import {
  UserCourseListGqlResponse,
  UserCourseListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => UserCourseListGqlResponse)
export class UserCourseListQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => UserCourseListPaginatedCursorGqlResponse, {
    name: "userCourseList",
    description:
      "Get active courses for anonymous users and END_USER views with purchase state",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async findUserCourses(
    @Args("input") input: CourseListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserCourseListPaginatedCursorGqlResponse> {
    const user = context.req?.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (user && !isEndUser) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.END_USER_OR_ANONYMOUS_ONLY);
    }

    return this.courseService.listForUser(
      input,
      isEndUser ? user.userId : undefined,
    );
  }
}
