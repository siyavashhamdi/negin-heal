import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { PaymentCouponService } from "../../payment-coupon.service";
import { PaymentCouponListGqlInput } from "../inputs";
import {
  PaymentCouponListGqlResponse,
  PaymentCouponListPaginatedOffsetGqlResponse,
} from "../responses";

@Resolver(() => PaymentCouponListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PaymentCouponListQuery {
  constructor(private readonly paymentCouponService: PaymentCouponService) {}

  @Query(() => PaymentCouponListPaginatedOffsetGqlResponse, {
    name: "paymentCouponList",
    description:
      "Get a paginated, filterable, sortable SUPER_ADMIN list of payment coupons using offset-based pagination",
  })
  async findPaymentCoupons(
    @Args("input") input: PaymentCouponListGqlInput,
  ): Promise<PaymentCouponListPaginatedOffsetGqlResponse> {
    return this.paymentCouponService.list(input);
  }
}
