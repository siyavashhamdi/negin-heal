import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard } from "../../../auth";
import { PaymentCouponService } from "../../payment-coupon.service";
import { PaymentCouponValidateGqlInput } from "../inputs";
import { PaymentCouponValidateGqlResponse } from "../responses";

@Resolver(() => PaymentCouponValidateGqlResponse)
@UseGuards(GqlAuthGuard)
export class PaymentCouponValidateQuery {
  constructor(private readonly paymentCouponService: PaymentCouponService) {}

  @Query(() => PaymentCouponValidateGqlResponse, {
    name: "paymentCouponValidate",
    description: "Validate a payment coupon for the current user's course purchase",
  })
  async validatePaymentCoupon(
    @Args("input") input: PaymentCouponValidateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<PaymentCouponValidateGqlResponse> {
    const user = context.req.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (!user || !isEndUser) {
      throw new ForbiddenException(
        "paymentCouponValidate is only available to END_USER accounts",
      );
    }

    return this.paymentCouponService.validateForCoursePurchase(
      input,
      user.userId,
    );
  }
}
