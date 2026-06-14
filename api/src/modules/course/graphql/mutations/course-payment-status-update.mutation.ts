import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CoursePaymentStatusUpdateGqlInput } from "../inputs";
import { CoursePaymentListGqlResponse } from "../responses";

@Resolver(() => CoursePaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CoursePaymentStatusUpdateMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CoursePaymentListGqlResponse, {
    name: "coursePaymentStatusUpdate",
    description:
      "Manually update a course payment status and optional review description",
  })
  async updateCoursePaymentStatus(
    @Args("input") input: CoursePaymentStatusUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CoursePaymentListGqlResponse> {
    return this.courseService.updatePaymentStatus(
      input,
      context.req.user!.userId,
    );
  }
}
