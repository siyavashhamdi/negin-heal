import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductDetailGqlInput } from "../inputs";
import { ProductListGqlResponse } from "../responses";

@Resolver(() => ProductListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductDetailQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductListGqlResponse, {
    name: "productDetail",
    description:
      "Get full product data for SUPER_ADMIN, including chapters and items for editing",
  })
  async findProductDetail(
    @Args("input") input: ProductDetailGqlInput,
  ): Promise<ProductListGqlResponse> {
    return this.productService.detail(input);
  }
}
