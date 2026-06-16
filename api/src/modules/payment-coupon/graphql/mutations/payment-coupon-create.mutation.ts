import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { PaymentCouponService } from "../../payment-coupon.service";
import { PaymentCouponCreateGqlInput } from "../inputs";
import { PaymentCouponListGqlResponse } from "../responses";

@Resolver(() => PaymentCouponListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PaymentCouponCreateMutation {
  constructor(private readonly paymentCouponService: PaymentCouponService) {}

  @Mutation(() => PaymentCouponListGqlResponse, {
    name: "paymentCouponCreate",
    description:
      "Create a payment coupon with discount rules, usage limits, course applicability, and active status",
  })
  async createPaymentCoupon(
    @Args("input") input: PaymentCouponCreateGqlInput,
  ): Promise<PaymentCouponListGqlResponse> {
    return this.paymentCouponService.create(input);
  }
}
