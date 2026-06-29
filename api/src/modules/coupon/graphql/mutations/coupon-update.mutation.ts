import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CouponService } from "../../coupon.service";
import { CouponUpdateGqlInput } from "../inputs";
import { CouponListGqlResponse } from "../responses";

@Resolver(() => CouponListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CouponUpdateMutation {
  constructor(private readonly couponService: CouponService) {}

  @Mutation(() => CouponListGqlResponse, {
    name: "couponUpdate",
    description:
      "Update a coupon's discount rules, usage limits, product applicability, or active status",
  })
  async updateCoupon(
    @Args("input") input: CouponUpdateGqlInput,
  ): Promise<CouponListGqlResponse> {
    return this.couponService.update(input);
  }
}
