import { ForbiddenException, UseGuards } from "@nestjs/common";

import { EXCEPTION_CONSTANT } from "../../../../constants/exception.constant";
import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductPurchaseSubmitGqlInput } from "../inputs";
import { ProductPurchaseSubmitGqlResponse } from "../responses";

@Resolver(() => ProductPurchaseSubmitGqlResponse)
@UseGuards(GqlAuthGuard)
export class ProductPurchaseSubmitMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductPurchaseSubmitGqlResponse, {
    name: "productPurchaseSubmit",
    description:
      "Submit a product purchase using gateway, card-to-card, cryptocurrency, or a free coupon",
  })
  async submitProductPurchase(
    @Args("input") input: ProductPurchaseSubmitGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<ProductPurchaseSubmitGqlResponse> {
    const user = context.req.user;
    const isEndUser = user?.roles?.includes(UserRole.END_USER) === true;

    if (!user || !isEndUser) {
      throw new ForbiddenException(EXCEPTION_CONSTANT.END_USER_ONLY);
    }

    return this.productService.submitPurchase(input, user.userId);
  }
}
