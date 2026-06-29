import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CouponService } from "../../coupon.service";
import { CouponDetailGqlInput } from "../inputs";
import { CouponListGqlResponse } from "../responses";

@Resolver(() => CouponListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CouponDetailQuery {
  constructor(private readonly couponService: CouponService) {}

  @Query(() => CouponListGqlResponse, {
    name: "couponDetail",
    description:
      "Get full coupon data for SUPER_ADMIN, including applicable products for editing",
  })
  async findCouponDetail(
    @Args("input") input: CouponDetailGqlInput,
  ): Promise<CouponListGqlResponse> {
    return this.couponService.detail(input);
  }
}
