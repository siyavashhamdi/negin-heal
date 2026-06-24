import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { OptionalGqlAuthGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { UserCourseDetailGqlInput } from "../inputs";
import { UserCourseDetailGqlResponse } from "../responses";

@Resolver(() => UserCourseDetailGqlResponse)
export class UserCourseDetailQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => UserCourseDetailGqlResponse, {
    name: "userCourseDetail",
    description:
      "Get active course details for anonymous users and END_USER accounts with locked content redacted",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async findUserCourseDetail(
    @Args("input") input: UserCourseDetailGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserCourseDetailGqlResponse> {
    const user = context.req?.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (user && !isEndUser) {
      throw new ForbiddenException(
        EXCEPTION_CONSTANT.END_USER_OR_ANONYMOUS_ONLY,
      );
    }

    return this.courseService.detailForUser(
      input,
      isEndUser ? user.userId : undefined,
    );
  }
}
