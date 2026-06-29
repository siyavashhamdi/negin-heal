import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductDeleteGqlInput } from "../inputs";

@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductDeleteMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => Boolean, {
    name: "productDelete",
    description: "Delete a product and remove its detached file attachments",
  })
  async deleteProduct(
    @Args("input") input: ProductDeleteGqlInput,
  ): Promise<boolean> {
    await this.productService.delete(input);
    return true;
  }
}
