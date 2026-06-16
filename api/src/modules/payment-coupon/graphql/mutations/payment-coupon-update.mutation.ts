import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { PaymentCouponService } from "../../payment-coupon.service";
import { PaymentCouponUpdateGqlInput } from "../inputs";
import { PaymentCouponListGqlResponse } from "../responses";

@Resolver(() => PaymentCouponListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PaymentCouponUpdateMutation {
  constructor(private readonly paymentCouponService: PaymentCouponService) {}

  @Mutation(() => PaymentCouponListGqlResponse, {
    name: "paymentCouponUpdate",
    description:
      "Update a payment coupon's discount rules, usage limits, course applicability, or active status",
  })
  async updatePaymentCoupon(
    @Args("input") input: PaymentCouponUpdateGqlInput,
  ): Promise<PaymentCouponListGqlResponse> {
    return this.paymentCouponService.update(input);
  }
}
