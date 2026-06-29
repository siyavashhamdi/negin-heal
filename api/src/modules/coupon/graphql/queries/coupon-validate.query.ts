import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard } from "../../../auth";
import { CouponService } from "../../coupon.service";
import { CouponValidateGqlInput } from "../inputs";
import { CouponValidateGqlResponse } from "../responses";

@Resolver(() => CouponValidateGqlResponse)
@UseGuards(GqlAuthGuard)
export class CouponValidateQuery {
  constructor(private readonly couponService: CouponService) {}

  @Query(() => CouponValidateGqlResponse, {
    name: "couponValidate",
    description: "Validate a coupon for the current user's product purchase",
  })
  async validateCoupon(
    @Args("input") input: CouponValidateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<CouponValidateGqlResponse> {
    const user = context.req.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (!user || !isEndUser) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.END_USER_ONLY);
    }

    return this.couponService.validateForProductPurchase(input, user.userId);
  }
}
