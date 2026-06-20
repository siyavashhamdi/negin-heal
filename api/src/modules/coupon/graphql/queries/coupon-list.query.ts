import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { CouponService } from "../../coupon.service";
import { CouponListGqlInput } from "../inputs";
import {
  CouponListSummaryGqlResponse,
  CouponListPaginatedOffsetGqlResponse,
} from "../responses";

@Resolver(() => CouponListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class CouponListQuery {
  constructor(private readonly couponService: CouponService) {}

  @Query(() => CouponListPaginatedOffsetGqlResponse, {
    name: "couponList",
    description:
      "Get a paginated, filterable, sortable SUPER_ADMIN list of coupons using offset-based pagination",
  })
  async findCoupons(
    @Args("input") input: CouponListGqlInput,
  ): Promise<CouponListPaginatedOffsetGqlResponse> {
    return this.couponService.list(input);
  }
}
