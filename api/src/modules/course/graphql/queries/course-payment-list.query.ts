import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CoursePaymentListGqlInput } from "../inputs";
import {
  CoursePaymentListGqlResponse,
  CoursePaymentListPaginatedOffsetGqlResponse,
} from "../responses";

@Resolver(() => CoursePaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CoursePaymentListQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => CoursePaymentListPaginatedOffsetGqlResponse, {
    name: "coursePaymentList",
    description:
      "Get paginated list of all course payments from user-course purchase records",
  })
  async findCoursePayments(
    @Args("input") input: CoursePaymentListGqlInput,
  ): Promise<CoursePaymentListPaginatedOffsetGqlResponse> {
    return this.courseService.listPayments(input);
  }
}
