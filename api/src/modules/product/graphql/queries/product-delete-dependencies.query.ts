import { UseGuards } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductDeleteGqlInput } from "../inputs";
import { ProductDeleteDependenciesGqlResponse } from "../responses";

@Resolver(() => ProductDeleteDependenciesGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductDeleteDependenciesQuery {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductDeleteDependenciesGqlResponse, {
    name: "productDeleteDependencies",
    description:
      "Inspect related records before deleting a product, including retained and removed dependencies",
  })
  async findProductDeleteDependencies(
    @Args("input") input: ProductDeleteGqlInput,
  ): Promise<ProductDeleteDependenciesGqlResponse> {
    return this.productService.getDeleteDependencies(input);
  }
}
