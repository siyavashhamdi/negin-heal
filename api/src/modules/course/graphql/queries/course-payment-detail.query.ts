import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CoursePaymentDetailGqlInput } from "../inputs";
import { CoursePaymentListGqlResponse } from "../responses";

@Resolver(() => CoursePaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class CoursePaymentDetailQuery {
  constructor(private readonly courseService: CourseService) {}

  @Query(() => CoursePaymentListGqlResponse, {
    name: "coursePaymentDetail",
    description:
      "Get full course payment data for SUPER_ADMIN and ADMIN, including receipt and audit fields for review",
  })
  async findCoursePaymentDetail(
    @Args("input") input: CoursePaymentDetailGqlInput,
  ): Promise<CoursePaymentListGqlResponse> {
    return this.courseService.paymentDetail(input);
  }
}
