import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CouponService } from "../../coupon.service";
import { CouponCreateGqlInput } from "../inputs";
import { CouponListGqlResponse } from "../responses";

@Resolver(() => CouponListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CouponCreateMutation {
  constructor(private readonly couponService: CouponService) {}

  @Mutation(() => CouponListGqlResponse, {
    name: "couponCreate",
    description:
      "Create a coupon with discount rules, usage limits, product applicability, and active status",
  })
  async createCoupon(
    @Args("input") input: CouponCreateGqlInput,
  ): Promise<CouponListGqlResponse> {
    return this.couponService.create(input);
  }
}
