import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

import { UserRole } from "../../../../enums";
import { GraphQLContext } from "../../../../types/graphql-context.types";
import { GqlAuthGuard, Roles, RolesGuard } from "../../../auth";
import { ProductService } from "../../product.service";
import { ProductPaymentStatusUpdateGqlInput } from "../inputs";
import { ProductPaymentListGqlResponse } from "../responses";

@Resolver(() => ProductPaymentListGqlResponse)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ProductPaymentStatusUpdateMutation {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductPaymentListGqlResponse, {
    name: "productPaymentStatusUpdate",
    description:
      "Manually update a product payment status and optional review description",
  })
  async updateProductPaymentStatus(
    @Args("input") input: ProductPaymentStatusUpdateGqlInput,
    @Context() context: GraphQLContext,
  ): Promise<ProductPaymentListGqlResponse> {
    return this.productService.updatePaymentStatus(
      input,
      context.req.user!.userId,
    );
  }
}
