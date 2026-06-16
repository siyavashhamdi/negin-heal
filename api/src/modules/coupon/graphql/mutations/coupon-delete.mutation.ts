import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CouponService } from "../../coupon.service";
import { CouponDeleteGqlInput } from "../inputs";

@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CouponDeleteMutation {
  constructor(private readonly couponService: CouponService) {}

  @Mutation(() => Boolean, {
    name: "couponDelete",
    description: "Delete a coupon",
  })
  async deleteCoupon(
    @Args("input") input: CouponDeleteGqlInput,
  ): Promise<boolean> {
    await this.couponService.delete(input);
    return true;
  }
}
