import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductUpdateGqlInput } from "../inputs";
import { ProductListGqlResponse } from "../responses";

@Resolver(() => ProductListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductUpdateMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductListGqlResponse, {
    name: "productUpdate",
    description:
      "Update a product and clean up replaced or removed file attachments",
  })
  async updateProduct(
    @Args("input") input: ProductUpdateGqlInput,
  ): Promise<ProductListGqlResponse> {
    return this.productService.update(input);
  }
}
