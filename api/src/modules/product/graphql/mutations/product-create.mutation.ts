import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductCreateGqlInput } from "../inputs";
import { ProductListGqlResponse } from "../responses";

@Resolver(() => ProductListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductCreateMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductListGqlResponse, {
    name: "productCreate",
    description:
      "Create a product with chapters and items, returning calculated release and item types",
  })
  async createProduct(
    @Args("input") input: ProductCreateGqlInput,
  ): Promise<ProductListGqlResponse> {
    return this.productService.create(input);
  }
}
