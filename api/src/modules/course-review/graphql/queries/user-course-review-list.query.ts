import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";
import { Types } from "mongoose";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { OptionalGqlAuthGuard } from "../../../auth";
import { CourseReviewService } from "../../course-review.service";
import { UserCourseReviewListGqlInput } from "../inputs";
import {
  UserCourseReviewListGqlResponse,
  UserCourseReviewListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => UserCourseReviewListGqlResponse)
export class UserCourseReviewListQuery {
  constructor(private readonly courseReviewService: CourseReviewService) {}

  @Query(() => UserCourseReviewListPaginatedCursorGqlResponse, {
    name: "userCourseReviewList",
    description:
      "Get a cursor-paginated list of public course reviews for anonymous users and END_USER accounts",
  })
  @UseGuards(OptionalGqlAuthGuard)
  async findUserCourseReviews(
    @Args("input") input: UserCourseReviewListGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<UserCourseReviewListPaginatedCursorGqlResponse> {
    const user = context.req?.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (user && !isEndUser) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.END_USER_OR_ANONYMOUS_ONLY);
    }

    return this.courseReviewService.listForEndUser(
      input,
      isEndUser ? new Types.ObjectId(user.userId) : undefined,
    );
  }
}
