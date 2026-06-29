import { Args, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductListGqlInput } from "../inputs";
import {
  ProductListSummaryGqlResponse,
  ProductListPaginatedCursorGqlResponse,
} from "../responses";

@Resolver(() => ProductListSummaryGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductListQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductListPaginatedCursorGqlResponse, {
    name: "productList",
    description:
      "Get a paginated, filterable, sortable admin list of products with calculated release and item types",
  })
  async findAllProducts(
    @Args("input") input: ProductListGqlInput,
  ): Promise<ProductListPaginatedCursorGqlResponse> {
    return this.productService.list(input);
  }
}
