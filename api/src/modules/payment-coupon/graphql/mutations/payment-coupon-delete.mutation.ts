import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { PaymentCouponService } from "../../payment-coupon.service";
import { PaymentCouponDeleteGqlInput } from "../inputs";

@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PaymentCouponDeleteMutation {
  constructor(private readonly paymentCouponService: PaymentCouponService) {}

  @Mutation(() => Boolean, {
    name: "paymentCouponDelete",
    description: "Delete a payment coupon",
  })
  async deletePaymentCoupon(
    @Args("input") input: PaymentCouponDeleteGqlInput,
  ): Promise<boolean> {
    await this.paymentCouponService.delete(input);
    return true;
  }
}
