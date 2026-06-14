import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CourseService } from "../../course.service";
import { CoursePaymentManualCreateGqlInput } from "../inputs";
import { CoursePaymentListGqlResponse } from "../responses";

@Resolver(() => CoursePaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CoursePaymentManualCreateMutation {
  constructor(private readonly courseService: CourseService) {}

  @Mutation(() => CoursePaymentListGqlResponse, {
    name: "coursePaymentManualCreate",
    description:
      "Create a manual course payment record for an active paid course as a super admin",
  })
  async createManualCoursePayment(
    @Args("input") input: CoursePaymentManualCreateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CoursePaymentListGqlResponse> {
    return this.courseService.createManualPayment(
      input,
      context.req.user!.userId,
    );
  }
}
